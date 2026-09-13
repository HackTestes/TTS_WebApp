const version = "1"
const main_page = "./tts.html"


self.addEventListener('install', event =>
{
    console.log('Install event');
    self.skipWaiting();

    event.waitUntil(
        caches.open('web-tts-pages').then(cache => {cache.add(main_page)})
    );
});

self.addEventListener('activate', event =>
{
    console.log('Activate event');
    self.skipWaiting();
});

async function HandleFetch(event)
{
    const cache = await caches.open("web-tts-pages");
    const cache_response = await cache.match(event.request);

    if (cache_response != undefined && event.request.headers.get("cache") != 'reload')
    {
        console.log(`Cache responded`);
        return cache_response;
    }

    // The cache didn't find the page or we are trying to bypass it
    // Try from the network
    const network_response = await fetch(event.request);
    console.log(`Network responded`);

    // The network got something
    
    /*
    // Only update the cache if it is different
    if (cache_response.bytes() != network_response.clone().bytes())
    {
        event.waitUntil( cache.put(event.request, network_response.clone()) );
    }
    */
    event.waitUntil( cache.put(event.request, network_response.clone()) );
    return network_response;
}

self.addEventListener('fetch', event =>
{
    event.respondWith( HandleFetch(event) );
});