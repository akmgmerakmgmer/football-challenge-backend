import http from 'k6/http'

export const options = {
    insecureSkipTLSVerify: true,
    noConnectionReuse: true,
    vus: 1,
    duration: '50s'
}
export default () => {
    http.get('http://localhost:4000/api/questions')
}