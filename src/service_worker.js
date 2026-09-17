// Note that this service worker is tailored to an app that uses a single html fole for the whole application
const version = "1"
const urls = [
    "./tts.html",
    "./manifest.json",
    "./app.svg"
]
const cache_name = "web-tts-pages"

// Not needed for now
function ArrayEquals(array_a, array_b)
{
    if ( Array.isArray(array_a) || Array.isArray(array_b) )
    {
        throw new Error("Type error, not an array");
    }

    // If any of them are undefined, return as if they aren't the same
    // This is valid even if they are both undefined
    if (array_a == undefined || array_b == undefined)
    {
        return false
    }

    // Fast comparison
    // If their sizes are different, they aren't equal at all
    if (array_a.length != array_b.length)
    {
        return false;
    }

    // If they have the same size, then we will check each element
    for (let i = 0; i < array_a.length; ++i)
    {
        if (array_a[i] != array_b[i])
        {
            return false
        }
    }

    return true
}

self.addEventListener('install', event =>
{
    console.log('Install event');
    self.skipWaiting();

    event.waitUntil(
        caches.open(cache_name).then(cache => {cache.addAll(urls)})
    );
});

self.addEventListener('activate', event =>
{
    console.log('Activate event');
    self.skipWaiting();
});

async function HandleFetch(event)
{
    // Check the cache first for a match
    const cache = await caches.open(cache_name);
    const cache_response = await cache.match(event.request);

    // Skip it if don't find a match or if the request explicitly says that the cache must be reloaded
    if (cache_response != undefined && event.request.headers.get("cache") != 'reload')
    {
        console.log(`Cache responded`);
        return cache_response;
    }

    // The cache didn't find the page or we are trying to bypass it
    // Try from the network
    const network_response = await fetch(event.request);
    console.log(`Network responded`);

    // The network got something, update the cache
    event.waitUntil( cache.add(event.request, network_response.clone()) );
    return network_response;
}

self.addEventListener('fetch', event =>
{
    console.log('Fetch event');
    event.respondWith( HandleFetch(event) );
});

async function HandleMessages(event)
{
    console.log(`Service worker got a new message!`);
    const message = event.data;

    if (message.operation = "update-cache")
    {
        console.log("Manual cache update triggered");

        const cache = await caches.open(cache_name);
        let cache_updated = false;

        for (let i=0; i < urls.length; i++)
        {
            // Get a response from the cache and network, so they can be compared
            const cache_response = await cache.match(urls[i]);

            // Bypass the cache and always ask the server
            // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching
            // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
            const network_response = await fetch(urls[i],
            {
                signal: AbortSignal.timeout(10000),
                headers: {
                    'Cache-Control': 'no-cache',
                }
            });

            // Compare the results
            if ( await cache_response.clone().text() != await network_response.clone().text() )
            {
                // They aren't the same, then we update the cache
                await cache.add(urls[i], network_response.clone());
                // Signal that there was an update
                cache_updated = true;
            }
        }

        // Message back the page with what happend
        if (cache_updated == true)
        {
            event.source.postMessage({operation: "update-cache", status: "updated"})
        }
        else
        {
            event.source.postMessage({operation: "update-cache", status: "no-update-available"})
        }
    }
    else
    {
        throw new Error("Invalid message oparation");
    }
}

addEventListener("message", (event) =>
{
    HandleMessages(event);
});