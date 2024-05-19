// Spike Test tests when your App is blown up and increased suddenly in users
import http from 'k6/http'
import { sleep } from 'k6'

export const options = {
    insecureSkipTLSVerify: true,
    noConnectionReuse: true,
    stages: [
        { duration: '10s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '10s', target: 1400 },
        { duration: '3m', target: 1400 },
        { duration: '10s', target: 100 },
        { duration: '1m', target: 100 }
    ]
}
export default () => {
    http.get('http://localhost:4000/api/questions')
    sleep(1)
}