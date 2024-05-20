// Spike Test tests when your App is blown up and increased suddenly in users
import http from 'k6/http'
import { sleep } from 'k6'
export const options = {
    insecureSkipTLSVerify: true,
    noConnectionReuse: false, // Enable connection reuse
    stages: [
        { duration: '1m', target: 100 },   // Gradual ramp-up to 100 users
        { duration: '2m', target: 400 },   // Gradual ramp-up to 400 users
        { duration: '1m', target: 1400 },  // Gradual ramp-up to 1400 users
        { duration: '3m', target: 1400 },  // Sustained load at 1400 users
        { duration: '1m', target: 500 },   // Gradual ramp-down to 500 users
        { duration: '2m', target: 100 }    // Gradual ramp-down to 100 users
    ],
};
export default () => {
    http.get('https://football-challenge-backend.vercel.app/api/questions')
    sleep(1)
}