#!/usr/bin/expect
set login "zhumo"
set addr "182.92.98.251"
#填写密码
set pw "your pwd"

set timeout 10
spawn ssh $login@$addr
expect {
    "*password:" {
        send "$pw\r"
        send "cd /opt/zhumo\r"
        send "git pull\r"
        send "npm install\r"
        send "bower install\r"
        send "pm2 kill\r"
        send "pm2 start process.json\r"
        send "exit\r"
        interact
    }
    "*zhumo*" {
        send "cd /opt/zhumo\r"
        send "git pull\r"
        send "npm install\r"
        send "bower install\r"
        send "pm2 kill\r"
        send "pm2 start process.json\r"
        send "exit\r"
        interact
    }
}
