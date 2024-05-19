// Will Stress the system with requests as much as possible to test it's reliabilityimport http from 'k6/http'
import http from 'k6/http'
import { sleep } from 'k6'

export const options = {
    insecureSkipTLSVerify: true,
    noConnectionReuse: true,
    stages: [
        { duration: '2m', target: 1500 },
        { duration: '5m', target: 2000 }
    ]
}
export default () => {
    http.get('http://localhost:4000/api/questions')
    sleep(1)
}