const getParam =(_ => {
  const search = location.search.replace(/\?/, '')
  const array = search.split('&')
  const object = {}
  for (let i = 0; i < array.length; i++) {
    const ary = array[i].split('=')
    object[ary[0]] = ary[1]
  }
  return object
})()
const wsParam = getParam.ws
let ws
const startWs = (wsParam) => {
  ws = new WebSocket(`ws://localhost:${wsParam}`)
  ws.addEventListener('message', e => {
    console.log(e)
    const count = e.data
    document.getElementById('count').textContent = count
  })
  ws.addEventListener('close', e => {
    startWs(wsParam)
  })
}
startWs(wsParam)
setTimeout(_ => {
  ws.send('getCount')
}, 1000)