#![deny(warnings)]

use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Request, Response, Server, Client };
// use hyper_tls::HttpsConnector;

async fn proxy(req: Request<Body>) -> Result<Response<Body>, hyper::Error> {
    let client = Client::new();
    print!("\r\n{}\r\n", req.uri().path());

    let r = client.request(req).await?;
    
    let resp_headers = r.headers().clone();

    let mut resp = Response::new(r.into_body());
    let mut_resp = resp.headers_mut();

    let header_keys = resp_headers.keys();
    header_keys.for_each(|key| {
        let v = resp_headers.get(key).unwrap();
        mut_resp.insert(key, v.into());
        println!("{}: {}", key, v.to_str().unwrap());
    });

    Ok(resp)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let addr = ([127, 0, 0, 1], 8080).into();

    let service = make_service_fn(|_| async { Ok::<_, hyper::Error>(service_fn(proxy)) });

    let server = Server::bind(&addr).serve(service);

    println!("Listening on http://{}", addr);

    server.await?;

    Ok(())
}