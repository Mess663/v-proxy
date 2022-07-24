use openssl::pkcs12::Pkcs12;
use openssl::ssl::{SslMethod, SslAcceptorBuilder, SslStream};
use std::fs::File;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::sync::Arc;
use std::thread;

// In this example we retrieve our keypair and certificate chain from a PKCS #12 archive,
// but but they can also be retrieved from, for example, individual PEM- or DER-formatted
// files. See the documentation for the `PKey` and `X509` types for more details.
fn main() {
    let mut file = File::open("identity.pfx").unwrap();
    let mut pkcs12 = vec![];
    file.read_to_end(&mut pkcs12).unwrap();
    let pkcs12 = Pkcs12::from_der(&pkcs12).unwrap();
    let identity = pkcs12.parse("password123").unwrap();

    let acceptor = SslAcceptorBuilder::mozilla_intermediate(SslMethod::tls(),
                                                            &identity.pkey,
                                                            &identity.cert,
                                                            &identity.chain)
        .unwrap()
        .build();
    let acceptor = Arc::new(acceptor);

    let listener = TcpListener::bind("127.0.0.1:8080").unwrap();

    fn handle_client(stream: SslStream<TcpStream>) {
    let mut buf = [0u8 ;4096];
    match stream.read(&mut buf) {
        Ok(_) => {
            let req_str = String::from_utf8_lossy(&buf);
            println!("{}", req_str);
        },
        Err(e) => println!("Unable to read stream: {}", e),
    }
    }

    for stream in listener.incoming() {
        match stream {
            Ok(stream) => {
                let acceptor = acceptor.clone();
                thread::spawn(move || {
                    let stream = acceptor.accept(stream).unwrap();
                    handle_client(stream);
                });
            }
            Err(e) => { /* connection failed */ }
        }
    }
}