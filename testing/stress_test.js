// Will Stress the system with requests as much as possible to test it's reliabilityimport http from 'k6/http'
import http from 'k6/http'
import { sleep } from 'k6'

export const options = {
    insecureSkipTLSVerify: true,
    noConnectionReuse: true,
    stages: [
        { duration: '2m', target: 1000 },
        // { duration: '5m', target: 1400 },
    ]
}
export default () => {
    http.get('https://football-challenge-backend.vercel.app/api/questions')
    sleep(1)
}