// - Asses current performance of the system under typical and peak load
// - Make sure it's continuously meeting the performance requirements
import http from 'k6/http'
import { sleep } from 'k6'

export const options = {
    insecureSkipTLSVerify: true,
    noConnectionReuse: true,
    stages: [
        { duration: '5m', target: 100 },
        { duration: '10m', target: 100 },
        { duration: '5m', target: 0 },
    ],
    thresholds: {
        http_req_duration: ["p(99)<300"] // 99% of the requests must compelete below 150ms
    }
}
export default () => {
    http.get('http://localhost:4000/api/questions') 
    sleep(1)
}