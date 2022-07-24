use std::net::{TcpStream, TcpListener};
use std::io::{Read, Write};
use std::{thread, fs};
use percent_encoding::percent_decode;


fn handle_read(mut stream: &TcpStream) {
    let mut buf = [0u8 ;4096];
    match stream.read(&mut buf) {
        Ok(_) => {
            let req_str = String::from_utf8_lossy(&buf);

            let mut words = req_str.split_whitespace();
            words.next();
            let host = words.next().unwrap();
            let mats: Vec<&str> = host.matches("www.mafengwo.cn").collect();
            if mats.len() > 0 {
                print!("域名：{}\r\n\r\n", host);
                let host_port = format!("{}{}", host, ":80");
                // http://www.mafengwo.cn/travel-scenic-spot/mafengwo/11475.html
                match TcpStream::connect("www.mafengwo.cn:80") {
                    Ok(mut proxy_stream) => {
                        print!("请求：{}\r\n", req_str);
                        proxy_stream.write(req_str.as_bytes()).unwrap();

                        let mut buffer = [0u8; 211096];
                        proxy_stream.read(&mut buffer).unwrap();
                        // let proxy_str = percent_decode(&buffer).decode_utf8().unwrap();
                        let proxy_str  = String::from_utf8_lossy(&buffer[..]);
                        print!("响应：{}\r\n\r\n", proxy_str);
                        let contents = fs::read_to_string("index.html").unwrap();
                        let response = format!("{}{}", "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n", proxy_str);
                        // let response = format!("{}{}", "HTTP/1.1 200 OK\r\n", proxy_str);
                        
                        match stream.write(response.as_bytes()) {
                            Ok(_) => {
                                print!("{}", "proxy success\r\n\r\n");
                            } 
                            Err(e) => {
                                println!("Unable to proxy write: {}", e);
                            }
                        }
                        stream.flush().unwrap();
                    } 
                    Err(e) => {
                        println!("Unable to proxy: {}", e);
                    }
                }
            }
        },
        Err(e) => println!("Unable to read stream: {}", e),
    }
}

fn handle_write(mut stream: TcpStream) {
    let contents = fs::read_to_string("index.html").unwrap();
    let response = format!("{}{}", "HTTP/2.0 200 OK\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n", contents);
    stream.write(response.as_bytes()).unwrap();
}

fn handle_client(stream: TcpStream) {
    handle_read(&stream);
    // handle_write(stream);
}

fn main() {
    let listener = TcpListener::bind("127.0.0.1:8080").unwrap();
    println!("Listening for connections on port {}", "127.0.0.1");

    for stream in listener.incoming() {
        match stream {
            Ok(stream) => {
                thread::spawn(|| {
                    handle_client(stream)
                });
            }
            Err(e) => {
                println!("Unable to connect: {}", e);
            }
        }
    }
}