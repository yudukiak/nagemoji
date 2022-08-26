const path = require('path')
const { LiveChat } = require('youtube-chat')
const { channelId, videoId } = require('@gonetone/get-youtube-id-by-url')
const http = require('http')
const ws = require('ws')
const fs = require('fs')
let wsServer
let counter = 0
const startServer = _ => {
  const getHttp = (req, res) => {
    const url = req.url
    let data, mime
    if ('/script.js' === url) {
      data = fs.readFileSync(`${__dirname}/count/script.js`, 'utf-8')
      mime = 'text/javascript'
    } else if ('/style.css' === url) {
      data = fs.readFileSync(`${__dirname}/count/style.css`, 'utf-8')
      mime = 'text/css'
    } else if ('/favicon.ico' === url) {
      data = ''
      mime = ''
    } else {
      data = fs.readFileSync(`${__dirname}/count/index.html`, 'utf-8')
      mime = 'text/html'
    }
    res.writeHead(200, {
      'Content-Type': mime
    })
    res.write(data)
    res.end()
  }
  const server = http.createServer()
  const serverPort = document.getElementById('serverPort').value
  server.on('request', getHttp)
  server.listen(serverPort)
  // IPC通信
  const wsServerPort = document.getElementById('wsServerPort').value
  wsServer = new ws.Server({
    port: wsServerPort
  })
  wsServer.on('connection', res => {
    res.on('message', message => {
      const sendMessage = (new TextDecoder).decode(Uint8Array.from(message))
      if (sendMessage === 'getCount')
        wsServer.clients.forEach(client => client.send(counter))
      // テスト用
      if (/^-?\d+$/.test(sendMessage)) {
        counter = counter + Number(sendMessage)
        wsServer.clients.forEach(client => client.send(counter))
      }
      document.getElementById('countNum').value = counter
    })
  })
  const obs = document.getElementById('obs')
  const obsurl = `http://localhost:${serverPort}/?ws=${wsServerPort}`
  obs.setAttribute('href', obsurl)
  obs.textContent = obsurl
  const countNum = document.getElementById('countNum').value
  counter = Number(countNum)
  setTimeout(_ => {
    console.log(counter)
    wsServer.clients.forEach(client => client.send(counter))
  }, 1000)
}

const getComment = async (LiveChat, channelId) => {
  const url = document.getElementById('url').value
  const target = document.getElementById('target').value
  const ChannelID = await channelId(url)
  const liveChat = new LiveChat({
    channelId: ChannelID
  })
  liveChat.on('chat', (chatItem) => {
    //console.log(chatItem)
    const messagesAry = chatItem.message
    let messageText = ''
    for (let i = 0; i < messagesAry.length; i++)
      messageText += messagesAry[i].text || messagesAry[i].emojiText
    const reg = target.replace(/,/g, '|')
    const count = (messageText.match(new RegExp(reg, 'gi')) || []).length
    counter = counter + count
    console.log(`${count}/${counter} : ${messageText}`)
    if (count) wsServer.clients.forEach(client => client.send(counter))
  })
  const ok = await liveChat.start()
}

// バージョンチェック
const checkVersion = (version) => {
  const btnDisplay = _ => {
    document.getElementById('notver').classList.add('d-none')
    document.getElementById('newver').classList.remove('d-none')
  }
  fetch('https://api.github.com/repositories/502347200/releases')
    .then(result => result.json())
    .then((outputs) => {
      const output = outputs[0] || { tag_name: 'v 0.0.0-test' }
      const tag_name = output.tag_name.match(/(\d+\.\d+\.\d+)/gi)[0]
      const versionAry = version.split('.')
      const tagNameAry = tag_name.split('.')
      //tagNameAry[0] = '0'
      //tagNameAry[1] = '0'
      //tagNameAry[2] = '1'
      console.log('GitHub JSON', outputs)
      console.log('GitHub JSON[0]', output)
      console.log('利用バージョン', versionAry)
      console.log('最新バージョン', tagNameAry)
      if (versionAry[0] < tagNameAry[0]) {
        btnDisplay()
      } else if (versionAry[1] < tagNameAry[1]) {
        btnDisplay()
      } else if (versionAry[2] < tagNameAry[2]) {
        btnDisplay()
      }
    }).catch(err => console.error(err))
}

// カウント記入
const countNumValSet = (num) => {
  document.getElementById('countNum').value = num
  counter = num
  if (wsServer) wsServer.clients.forEach(client => client.send(num))
  settingSave()
}

// 保存
const settingSave = (isStart) => {
  let object = {}
  const elms = document.querySelectorAll('input')
  for (let i = 0; i < elms.length; i++) {
    const elm = elms[i]
    const id = elm.getAttribute('id')
    const value = elm.value
    object[id] = value
    if (isStart) elm.setAttribute('readOnly', true)
  }
  const json = JSON.stringify(object)
  localStorage.setItem('setting', json)
}

// 読込
const settingLoad = _ => {
  const json = localStorage.getItem('setting')
  const object = JSON.parse(json)
  for (let id in object) {
    const value = object[id]
    if (value) document.getElementById(id).value = value
  }
}

window.onload = _ => {
  // バージョンチェック
  const package = require(path.join(__dirname, 'package.json'))
  const version = process.env.npm_package_version || package.version
  document.getElementById('ver').innerHTML = version
  checkVersion(version)
  // イベント追加
  const startButton = document.getElementById('start')
  settingLoad()
  startButton.addEventListener('click', event => {
    startButton.classList.remove('btn-outline-primary')
    startButton.classList.add('btn-outline-secondary')
    startButton.setAttribute('disabled', true)
    getComment(LiveChat, channelId)
    settingSave(true)
    startServer()
  })
  document.getElementById('restart').addEventListener('click', event => {
    location.reload()
  })
  document.getElementById('countReset').addEventListener('click', event => {
    countNumValSet(0)
  })
  document.getElementById('add').addEventListener('click', event => {
    const val = document.getElementById('countNum').value
    countNumValSet(Number(val) + 1)
  })
  document.getElementById('sub').addEventListener('click', event => {
    const val = document.getElementById('countNum').value
    countNumValSet(Number(val) - 1)
  })
}