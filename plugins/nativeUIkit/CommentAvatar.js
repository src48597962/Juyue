// by:鬼佬的原生组件工坊
var pool = null,
    owners = 0;
function runnable(fn) {
    return new java.lang.Runnable({
        run: function () {
            var cx = org.mozilla.javascript.Context.enter();
            try {
                cx.setLanguageVersion(200);
                fn();
            } finally {
                org.mozilla.javascript.Context.exit();
            }
        }
    });
}
var iconPool = null,
    iconHandler = null,
    iconOwners = 0,
    iconPending = {},
    iconCache = [],
    iconBytes = 0;
function sampleFor(width, height, target) {
    var sample = 1;
    var tw = Math.max(1, Math.min(1024, Number(target.width) || 256));
    var th = Math.max(1, Math.min(1024, Number(target.height) || 256));
    var pixels = Math.max(4096, Math.min(768 * 768, Number(target.maxPixels) || 768 * 768));
    while (
        sample < 1024 &&
        ((width / (sample * 2) >= tw && height / (sample * 2) >= th) ||
            Math.ceil(width / sample) * Math.ceil(height / sample) > pixels)
    )
        sample *= 2;
    return sample;
}
function applyDecoder(input, url, headers, module) {
    if (!module) return input;
    var output = null;
    try {
        var adapter = $.require(String(module));
        if (!adapter || typeof adapter.decode !== "function")
            throw new Error("Image decoder contract");
        output = adapter.decode(input, String(url), headers || {});
        if (!output || typeof output.read !== "function" || typeof output.close !== "function")
            throw new Error("Image decoder must return InputStream");
        return output;
    } catch (error) {
        if (output && output !== input && typeof output.close === "function") output.close();
        throw error;
    } finally {
        if (output !== input) input.close();
    }
}
// Persist encoded image bytes after transport decoding, never a re-encoded Bitmap.
// Context is supplied by PostCard; other callers keep the existing in-memory contract.
var postDiskLocks = null,
    postDiskTrimAt = 0;
function initPostDiskLocks() {
    if (!postDiskLocks) {
        postDiskLocks = [];
        for (var stripe = 0; stripe < 16; stripe++)
            postDiskLocks.push(new java.util.concurrent.locks.ReentrantLock());
    }
}
function postDiskFile(context, url, headers, target, requestJob, openInput) {
    if (!context || typeof context.getCacheDir !== "function" || !/^https?:\/\//i.test(url))
        return null;
    var decoder = target && target.decoderModule ? String(target.decoderModule) : "";
    var revision = "";
    if (decoder) {
        var adapter = $.require(decoder);
        revision = JSON.stringify([
            String(adapter.cacheVersion || adapter.imageDecoderVersion || ""),
            String(adapter.decode || ""),
            String(adapter.streamDecoder || "")
        ]);
    }
    var identity = JSON.stringify([
        "post-bytes-v1",
        String(url),
        decoder,
        revision,
        Object.keys(headers || {})
            .sort()
            .map(function (name) {
                return [name, String(headers[name])];
            })
    ]);
    var digest = java.security.MessageDigest.getInstance("SHA-256").digest(
        new java.lang.String(identity).getBytes("UTF-8")
    );
    var key = "";
    for (var k = 0; k < digest.length; k++) key += ("0" + (digest[k] & 255).toString(16)).slice(-2);
    initPostDiskLocks();
    var lock = postDiskLocks[parseInt(key.charAt(0), 16)];
    lock.lock();
    var input = null,
        output = null,
        temporary = null;
    function cancelled() {
        if (requestJob && requestJob.cancelled) throw new Error("Image request cancelled");
    }
    function valid(file) {
        if (!file.isFile() || file.length() <= 0 || file.length() > 16 * 1024 * 1024) return false;
        var stream = new java.io.FileInputStream(file),
            magic = [];
        try {
            for (var n = 0; n < 12; n++) magic.push(stream.read());
        } finally {
            stream.close();
        }
        var image =
            (magic[0] === 255 && magic[1] === 216 && magic[2] === 255) ||
            (magic[0] === 137 && magic[1] === 80 && magic[2] === 78 && magic[3] === 71) ||
            (magic[0] === 71 && magic[1] === 73 && magic[2] === 70 && magic[3] === 56) ||
            (magic[0] === 82 &&
                magic[1] === 73 &&
                magic[2] === 70 &&
                magic[3] === 70 &&
                magic[8] === 87 &&
                magic[9] === 69 &&
                magic[10] === 66 &&
                magic[11] === 80);
        if (!image) return false;
        var bounds = new android.graphics.BitmapFactory.Options();
        bounds.inJustDecodeBounds = true;
        android.graphics.BitmapFactory.decodeFile(String(file.getAbsolutePath()), bounds);
        return bounds.outWidth > 0 && bounds.outHeight > 0;
    }
    function trim(folder, now, force) {
        if (!force && now - postDiskTrimAt < 60000) return;
        postDiskTrimAt = now;
        var files = folder.listFiles(),
            entries = [],
            bytes = 0;
        for (var i = 0; files && i < files.length; i++) {
            var entry = files[i],
                name = String(entry.getName()),
                age = now - Number(entry.lastModified());
            if (/\.part$/.test(name)) {
                if (age > 3600000) entry.delete();
                continue;
            }
            if (!/^[a-f0-9]{64}\.image$/.test(name)) continue;
            if (age > 86400000 || entry.length() <= 0 || entry.length() > 16 * 1024 * 1024) {
                entry.delete();
                continue;
            }
            entries.push(entry);
            bytes += Number(entry.length());
        }
        entries.sort(function (a, b) {
            return a.lastModified() - b.lastModified();
        });
        for (
            var j = 0;
            j < entries.length && (bytes > 64 * 1024 * 1024 || entries.length - j > 256);
            j++
        ) {
            var old = entries[j],
                size = Number(old.length());
            if (old.delete()) bytes -= size;
        }
    }
    try {
        cancelled();
        var folder = new java.io.File(context.getCacheDir(), "hiker-post-images-v1");
        if (!folder.isDirectory() && !folder.mkdirs()) throw new Error("Post image cache directory");
        var file = new java.io.File(folder, key + ".image");
        var now = java.lang.System.currentTimeMillis();
        // A fixed lifetime forces refresh after a day, independent of hit frequency.
        if (file.isFile() && now - Number(file.lastModified()) <= 86400000 && valid(file)) {
            trim(folder, now, false);
            return file;
        }
        if (file.exists()) file.delete();
        input = openInput();
        temporary = new java.io.File(folder, key + "." + java.lang.System.nanoTime() + ".part");
        output = new java.io.FileOutputStream(temporary);
        var buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 16384),
            length,
            total = 0;
        while ((length = input.read(buffer)) !== -1) {
            cancelled();
            total += Number(length);
            if (total > 16 * 1024 * 1024) throw new Error("Post image byte limit");
            output.write(buffer, 0, length);
        }
        output.close();
        output = null;
        input.close();
        input = null;
        cancelled();
        if (!valid(temporary)) throw new Error("Post image payload invalid");
        if (!temporary.renameTo(file)) throw new Error("Post image cache commit");
        temporary = null;
        trim(folder, now, true);
        return file;
    } finally {
        try {
            if (input) input.close();
        } finally {
            try {
                if (output) output.close();
            } finally {
                if (temporary) temporary.delete();
                lock.unlock();
            }
        }
    }
}

function decode(url, headers, sampleSize, requestJob, diskContext) {
    var conn = null,
        input = null,
        decoded = null,
        diskFile = null;
    var target = sampleSize && typeof sampleSize === "object" ? sampleSize : null;
    var adaptive = target && !target.sampleSize;
    function openInput() {
        if (requestJob && requestJob.cancelled) throw new Error("Image request cancelled");
        if (/^file:\//.test(String(url))) {
            var local = new java.io.File(String(new java.net.URI(url).getPath()));
            var localStream = applyDecoder(
                new java.io.FileInputStream(local),
                url,
                headers,
                target && target.decoderModule
            );
            return target ? new java.io.BufferedInputStream(localStream, 65536) : localStream;
        }
        var targetUrl = url;
        for (var redirect = 0; redirect <= 4; redirect++) {
            conn = new java.net.URL(targetUrl).openConnection();
            if (target && target.strictHttp) conn.setInstanceFollowRedirects(false);
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0");
            Object.keys(headers || {}).forEach(function (name) {
                var value = String(headers[name]);
                if (!/[\r\n]/.test(name + value)) conn.setRequestProperty(name, value);
            });
            if (requestJob) requestJob.connection = conn;
            if (!target || !target.strictHttp) break;
            var status = conn.getResponseCode();
            if ([301, 302, 303, 307, 308].indexOf(status) < 0) {
                if (status !== 200 && status !== 206) throw new Error("Poster HTTP " + status);
                break;
            }
            if (redirect === 4) throw new Error("Poster redirect limit");
            targetUrl = String(
                new java.net.URL(new java.net.URL(targetUrl), conn.getHeaderField("Location"))
            );
            if (!/^https?:\/\//.test(targetUrl)) throw new Error("Poster protocol");
            conn.disconnect();
            conn = null;
            if (requestJob && requestJob.cancelled) throw new Error("Image request cancelled");
        }
        if (requestJob) requestJob.connection = conn;
        if (requestJob && requestJob.cancelled) throw new Error("Image request cancelled");
        var stream = conn.getInputStream();
        stream = applyDecoder(stream, targetUrl, headers, target && target.decoderModule);
        return target ? new java.io.BufferedInputStream(stream, 65536) : stream;
    }
    try {
        var options = new android.graphics.BitmapFactory.Options();
        options.inSampleSize = target
            ? Math.max(1, Math.floor(Number(target.sampleSize) || 1))
            : Math.max(1, Math.floor(Number(sampleSize) || 4));
        if (String(url).indexOf("data:") === 0) {
            var bytes = android.util.Base64.decode(url.slice(url.indexOf(",") + 1), 0);
            if (target && target.decoderModule) {
                input = applyDecoder(
                    new java.io.ByteArrayInputStream(bytes),
                    url,
                    headers,
                    target.decoderModule
                );
                decoded = android.graphics.BitmapFactory.decodeStream(input, null, options);
            } else if (adaptive) {
                options.inJustDecodeBounds = true;
                android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.length, options);
                options.inSampleSize = sampleFor(options.outWidth, options.outHeight, target);
                options.inJustDecodeBounds = false;
                if (requestJob && requestJob.cancelled) return null;
                decoded = android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.length, options);
            } else decoded = android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        } else {
            if (diskContext && /^https?:\/\//i.test(String(url))) {
                try {
                    diskFile = postDiskFile(diskContext, url, headers, target, requestJob, openInput);
                } catch (cacheError) {
                    if (requestJob && requestJob.cancelled) return null;
                    if (input) {
                        input.close();
                        input = null;
                    }
                    if (conn) {
                        conn.disconnect();
                        conn = null;
                    }
                    // Cache storage is optional; retain the prior direct-stream path if storage fails.
                }
            }
            input = diskFile
                ? new java.io.BufferedInputStream(new java.io.FileInputStream(diskFile), 65536)
                : openInput();
            if (adaptive) {
                // Read dimensions without allocating pixels, then decode the same buffered response.
                input.mark(1024 * 1024);
                options.inJustDecodeBounds = true;
                android.graphics.BitmapFactory.decodeStream(input, null, options);
                options.inSampleSize = sampleFor(options.outWidth, options.outHeight, target);
                options.inJustDecodeBounds = false;
                try {
                    input.reset();
                } catch (resetError) {
                    input.close();
                    if (conn && typeof conn.disconnect === "function") conn.disconnect();
                    input = diskFile
                        ? new java.io.BufferedInputStream(new java.io.FileInputStream(diskFile), 65536)
                        : openInput();
                }
            }
            if (requestJob && requestJob.cancelled) return null;
            decoded = android.graphics.BitmapFactory.decodeStream(input, null, options);
        }
        // A truncated cached body can pass dimensions but fail full decoding. Drop it and retry once.
        if (!decoded && diskFile && (!requestJob || !requestJob.cancelled)) {
            diskFile.delete();
            if (input) input.close();
            input = openInput();
            options.inJustDecodeBounds = false;
            decoded = android.graphics.BitmapFactory.decodeStream(input, null, options);
        }
    } catch (error) {
        if ((!requestJob || !requestJob.cancelled) && typeof log === "function")
            log("Comment avatar decode failed");
    } finally {
        try {
            if (input) input.close();
        } finally {
            if (conn && typeof conn.disconnect === "function") conn.disconnect();
            if (requestJob) requestJob.connection = null;
        }
    }
    return decoded;
}
function cachedIcon(url, image, fallback, headers, sampleSize, notify) {
    var target =
        sampleSize && typeof sampleSize === "object"
            ? {
                width: Math.max(1, Math.min(1024, Number(sampleSize.width) || 256)),
                height: Math.max(1, Math.min(1024, Number(sampleSize.height) || 256))
            }
            : Math.max(1, Math.floor(Number(sampleSize) || 4));
    if (sampleSize && sampleSize.decoderModule) {
        target.decoderModule = String(sampleSize.decoderModule);
        if (sampleSize.sampleSize) target.sampleSize = sampleSize.sampleSize;
    }
    var key = JSON.stringify([
        String(url),
        target,
        Object.keys(headers || {})
            .sort()
            .map(function (name) {
                return [name, String(headers[name])];
            })
    ]);
    var subscriber = { image: image, fallback: fallback, released: false, status: "pending" };
    var job = null;
    iconOwners++;
    function state(value) {
        subscriber.status = value;
        if (notify && !subscriber.released) notify(value);
    }
    function paint(targetView, bitmap) {
        if (targetView.released) return;
        targetView.image.setImageBitmap(bitmap);
        targetView.image.setVisibility(0);
        targetView.fallback.setVisibility(8);
        targetView.status = "ready";
        if (targetView.notify) targetView.notify("ready");
    }
    function discard(bitmap) {
        if (
            bitmap &&
            typeof bitmap.recycle === "function" &&
            (typeof bitmap.isRecycled !== "function" || !bitmap.isRecycled())
        )
            bitmap.recycle();
    }
    subscriber.notify = notify;
    function subscribe() {
        if (subscriber.released) return false;
        state("pending");
        for (var i = 0; i < iconCache.length; i++) {
            if (iconCache[i].key !== key) continue;
            var hit = iconCache.splice(i, 1)[0];
            if (typeof hit.bitmap.isRecycled === "function" && hit.bitmap.isRecycled()) {
                iconBytes -= hit.bytes;
                break;
            }
            iconCache.push(hit);
            paint(subscriber, hit.bitmap);
            return true;
        }
        job = iconPending[key];
        if (job) job.waiters.push(subscriber);
        else {
            job = { waiters: [subscriber], cancelled: false };
            iconPending[key] = job;
            if (!iconHandler) iconHandler = new android.os.Handler(android.os.Looper.getMainLooper());
            if (!iconPool) iconPool = java.util.concurrent.Executors.newFixedThreadPool(4);
            var requestJob = job;
            requestJob.task = runnable(function () {
                if (requestJob.cancelled || !requestJob.waiters.length) return;
                var bitmap = null;
                try {
                    bitmap = decode(url, headers, target, requestJob);
                } catch (error) {
                    if (typeof log === "function") log("Cached image decode failed");
                }
                iconHandler.post(
                    runnable(function () {
                        if (requestJob.cancelled || iconPending[key] !== requestJob) {
                            discard(bitmap);
                            return;
                        }
                        delete iconPending[key];
                        var waiters = requestJob.waiters;
                        requestJob.waiters = [];
                        if (!bitmap) {
                            waiters.forEach(function (waiting) {
                                if (waiting.released) return;
                                waiting.status = "error";
                                if (waiting.notify) waiting.notify("error");
                            });
                            return;
                        }
                        if (!waiters.length) {
                            discard(bitmap);
                            return;
                        }
                        var bytes =
                            typeof bitmap.getRowBytes === "function"
                                ? Number(bitmap.getRowBytes()) * Number(bitmap.getHeight())
                                : 0;
                        if (bytes > 0 && bytes <= 4 * 1024 * 1024) {
                            iconCache.push({ key: key, bitmap: bitmap, bytes: bytes });
                            iconBytes += bytes;
                            while (iconCache.length > 32 || iconBytes > 4 * 1024 * 1024)
                                iconBytes -= iconCache.shift().bytes;
                        }
                        waiters.forEach(function (waiting) {
                            paint(waiting, bitmap);
                        });
                    })
                );
            });
            iconPool.execute(requestJob.task);
        }
        return true;
    }
    subscribe();
    return {
        state: function () {
            return subscriber.status;
        },
        retry: function () {
            return subscriber.status === "error" && !subscriber.released ? subscribe() : false;
        },
        destroy: function () {
            if (subscriber.released) return;
            subscriber.released = true;
            subscriber.status = "released";
            subscriber.notify = null;
            subscriber.image.setImageDrawable(null);
            subscriber.image = null;
            subscriber.fallback = null;
            if (job) {
                job.waiters = job.waiters.filter(function (waiting) {
                    return waiting !== subscriber;
                });
                if (!job.waiters.length && iconPending[key] === job) {
                    job.cancelled = true;
                    delete iconPending[key];
                    if (iconPool && typeof iconPool.remove === "function") iconPool.remove(job.task);
                    if (job.connection) {
                        try {
                            job.connection.disconnect();
                        } catch (ignore) { }
                    }
                }
            }
            iconOwners--;
            if (!iconOwners) {
                if (iconPool) iconPool.shutdownNow();
                iconPool = null;
                iconPending = {};
                // In-flight completions still run to discard their unowned decoded bitmap.
            }
        }
    };
}

// UI-thread owned LRU; worker threads only decode and observe cancellation.
// Entries evicted while painted stay alive until their final subscriber detaches.
var postPool = null,
    postHandler = null,
    postOwners = 0,
    postSubscribers = 0,
    postPending = {},
    postCache = [],
    postBytes = 0,
    postParkBytes = 0,
    postParkEntries = 0;
function discardPost(entry) {
    if (!entry || entry.cached || entry.refs) return;
    var bitmap = entry.bitmap;
    entry.bitmap = null;
    if (bitmap && !bitmap.isRecycled()) bitmap.recycle();
}
function trimPosts(all) {
    while (postCache.length && (all || postCache.length > 64 || postBytes > 8 * 1024 * 1024)) {
        var entry = postCache.shift();
        postBytes -= entry.bytes;
        entry.cached = false;
        discardPost(entry);
    }
}
function cancelPost(key, job) {
    job.cancelled = true;
    if (postPending[key] === job) delete postPending[key];
    if (postPool && typeof postPool.remove === "function") postPool.remove(job.task);
    if (job.connection) {
        try {
            job.connection.disconnect();
        } catch (ignore) { }
    }
}
function settlePosts() {
    if (postOwners || postSubscribers) return;
    trimPosts(true);
    Object.keys(postPending).forEach(function (key) {
        cancelPost(key, postPending[key]);
    });
    if (postPool) postPool.shutdownNow();
    postPool = null;
    // Keep the handler: late completion must still run to recycle its bitmap.
}
function retainPosts() {
    postOwners++;
}
function releasePosts() {
    postOwners = Math.max(0, postOwners - 1);
    settlePosts();
}
function postCacheInfo() {
    return {
        entries: postCache.length,
        bytes: postBytes,
        pending: Object.keys(postPending).length,
        owners: postOwners,
        subscribers: postSubscribers,
        parkedBytes: postParkBytes,
        parkedEntries: postParkEntries
    };
}
function cachedPost(url, image, fallback, headers, sampleSize, notify, diskContext) {
    // Subscriptions are created on the UI thread; publish locks before any workers start.
    if (diskContext && typeof diskContext.getCacheDir === "function") initPostDiskLocks();
    var target =
        sampleSize && typeof sampleSize === "object"
            ? {
                strictHttp: sampleSize.strictHttp === true,
                width: Math.max(1, Math.min(1024, Number(sampleSize.width) || 256)),
                height: Math.max(1, Math.min(1024, Number(sampleSize.height) || 256)),
                maxPixels: Math.max(
                    4096,
                    Math.min(768 * 768, Number(sampleSize.maxPixels) || 512 * 512)
                )
            }
            : Math.max(1, Math.floor(Number(sampleSize) || 4));
    // Decoder identity belongs to the cache key; identical URLs may carry different transports.
    if (sampleSize && sampleSize.decoderModule && target && typeof target === "object")
        target.decoderModule = String(sampleSize.decoderModule);
    if (sampleSize && sampleSize.sampleSize && typeof target === "object")
        target.sampleSize = sampleSize.sampleSize;
    var requestHeaders = {};
    Object.keys(headers || {}).forEach(function (name) {
        requestHeaders[name] = String(headers[name]);
    });
    var key = JSON.stringify([
        String(url),
        target,
        Object.keys(requestHeaders)
            .sort()
            .map(function (name) {
                return [name, requestHeaders[name]];
            })
    ]);
    var subscriber = {
        image: image,
        fallback: fallback,
        entry: null,
        released: false,
        status: "pending"
    },
        job = null,
        parkedEntry = null;
    postSubscribers++;
    function state(value) {
        subscriber.status = value;
        if (notify && !subscriber.released) notify(value);
    }
    function paint(waiting, entry) {
        if (waiting.released) return;
        waiting.entry = entry;
        entry.refs++;
        waiting.image.setImageBitmap(entry.bitmap);
        waiting.image.setVisibility(0);
        waiting.fallback.setVisibility(8);
        waiting.status = "ready";
        if (waiting.notify) waiting.notify("ready");
    }
    subscriber.notify = notify;
    function subscribe() {
        if (subscriber.released) return false;
        state("pending");
        for (var i = 0; i < postCache.length; i++) {
            if (postCache[i].key !== key) continue;
            var hit = postCache.splice(i, 1)[0];
            if (!hit.bitmap || hit.bitmap.isRecycled()) {
                postBytes -= hit.bytes;
                hit.cached = false;
                break;
            }
            postCache.push(hit);
            paint(subscriber, hit);
            return true;
        }
        job = postPending[key];
        if (job) job.waiters.push(subscriber);
        else {
            job = { waiters: [subscriber], cancelled: false, connection: null };
            postPending[key] = job;
            if (!postHandler) postHandler = new android.os.Handler(android.os.Looper.getMainLooper());
            if (!postPool) postPool = java.util.concurrent.Executors.newFixedThreadPool(3);
            var requestJob = job;
            requestJob.task = runnable(function () {
                if (requestJob.cancelled) return;
                var bitmap = decode(url, requestHeaders, target, requestJob, diskContext);
                postHandler.post(
                    runnable(function () {
                        if (requestJob.cancelled || postPending[key] !== requestJob) {
                            discardPost({ bitmap: bitmap, refs: 0, cached: false });
                            return;
                        }
                        delete postPending[key];
                        var waiters = requestJob.waiters;
                        requestJob.waiters = [];
                        if (!bitmap) {
                            waiters.forEach(function (waiting) {
                                if (waiting.released) return;
                                waiting.status = "error";
                                if (waiting.notify) waiting.notify("error");
                            });
                            return;
                        }
                        var bytes =
                            typeof bitmap.getAllocationByteCount === "function"
                                ? Number(bitmap.getAllocationByteCount())
                                : typeof bitmap.getRowBytes === "function"
                                    ? Number(bitmap.getRowBytes()) * Number(bitmap.getHeight())
                                    : Number(bitmap.getWidth()) * Number(bitmap.getHeight()) * 4;
                        var entry = { key: key, bitmap: bitmap, bytes: bytes, refs: 0, cached: false };
                        // Paint before trimming, so eviction never recycles a displayed allocation.
                        waiters.forEach(function (waiting) {
                            paint(waiting, entry);
                        });
                        if (bytes > 0 && bytes <= 8 * 1024 * 1024 && (postOwners || postSubscribers)) {
                            entry.cached = true;
                            postCache.push(entry);
                            postBytes += bytes;
                            trimPosts(false);
                        }
                        discardPost(entry);
                    })
                );
            });
            postPool.execute(requestJob.task);
        }
        return true;
    }
    function unpark() {
        if (!parkedEntry) return;
        parkedEntry.parkRefs--;
        if (!parkedEntry.parkRefs) {
            postParkBytes -= parkedEntry.bytes;
            postParkEntries--;
        }
        parkedEntry = null;
    }
    subscribe();
    return {
        // Retained hidden-tab pixels have a separate aggregate bound, not one budget per card.
        park: function () {
            if (subscriber.released || subscriber.status !== "ready" || !subscriber.entry) return false;
            if (parkedEntry) return true;
            var entry = subscriber.entry;
            if (
                !entry.parkRefs &&
                (postParkEntries >= 64 || postParkBytes + entry.bytes > 8 * 1024 * 1024)
            )
                return false;
            if (!entry.parkRefs) {
                entry.parkRefs = 0;
                postParkBytes += entry.bytes;
                postParkEntries++;
            }
            entry.parkRefs++;
            parkedEntry = entry;
            return true;
        },
        unpark: unpark,
        state: function () {
            return subscriber.status;
        },
        retry: function () {
            return subscriber.status === "error" && !subscriber.released ? subscribe() : false;
        },
        destroy: function () {
            if (subscriber.released) return;
            unpark();
            subscriber.released = true;
            subscriber.status = "released";
            subscriber.notify = null;
            subscriber.image.setImageDrawable(null);
            subscriber.image = null;
            subscriber.fallback = null;
            if (subscriber.entry) {
                subscriber.entry.refs--;
                discardPost(subscriber.entry);
                subscriber.entry = null;
            }
            if (job && postPending[key] === job) {
                job.waiters = job.waiters.filter(function (waiting) {
                    return waiting !== subscriber;
                });
                if (!job.waiters.length) cancelPost(key, job);
            }
            postSubscribers--;
            settlePosts();
        }
    };
}

function load(url, image, fallback, headers, sampleSize, cacheIcon, notify) {
    if (!/^(https?:\/\/|file:\/\/|data:image\/(png|jpeg|webp|gif);base64,)/.test(String(url || "")))
        return { destroy: function () { } };
    if (cacheIcon && cacheIcon.post)
        return cachedPost(url, image, fallback, headers, sampleSize, notify, cacheIcon.context);
    if (cacheIcon) return cachedIcon(url, image, fallback, headers, sampleSize, notify);
    if (!pool) pool = java.util.concurrent.Executors.newFixedThreadPool(2);
    owners++;
    var executor = pool,
        released = false,
        bitmap = null,
        requestJob = { cancelled: false, connection: null };
    var handler = new android.os.Handler(android.os.Looper.getMainLooper());
    function clear() {
        if (bitmap && !bitmap.isRecycled()) bitmap.recycle();
        bitmap = null;
    }
    var task = runnable(function () {
        if (released) return;
        var decoded = decode(url, headers, sampleSize, requestJob);
        if (!decoded) return;
        if (released) {
            decoded.recycle();
            return;
        }
        bitmap = decoded;
        handler.post(
            runnable(function () {
                if (released) {
                    clear();
                    return;
                }
                if (!bitmap) return;
                image.setImageBitmap(bitmap);
                image.setVisibility(0);
                fallback.setVisibility(8);
            })
        );
    });
    executor.execute(task);
    return {
        destroy: function () {
            if (released) return;
            released = true;
            requestJob.cancelled = true;
            if (typeof executor.remove === "function") executor.remove(task);
            if (requestJob.connection) {
                try {
                    requestJob.connection.disconnect();
                } catch (ignore) { }
            }
            handler.removeCallbacksAndMessages(null);
            image.setImageDrawable(null);
            clear();
            owners--;
            if (!owners && pool) {
                pool.shutdownNow();
                pool = null;
            }
        }
    };
}
$.exports = {
    imageDecoderVersion: 1,
    applyDecoder: applyDecoder,
    load: load,
    retainPosts: retainPosts,
    releasePosts: releasePosts,
    postCacheInfo: postCacheInfo
};

