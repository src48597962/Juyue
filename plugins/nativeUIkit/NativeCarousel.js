// by:鬼佬的原生组件工坊
var C = $.require(codePath + "plugins/nativeUIkit/Config.js");
var tokenKey = C.ns + "native.carousel.token.v1";
function normalize(values, options) {
    var style = (options || {}).style || "cards";
    var portrait = style === "cards" && !!(options || {}).portrait;
    return (Array.isArray(values) ? values : [])
        .filter(function (value) {
            return value && typeof value.id === "string" && value.id.length > 0;
        })
        .map(function (value) {
            var pic = portrait ? value.picPortrait || value.pic : value.pic;
            return {
                id: value.id,
                title: String(value.title || ""),
                pic: /^(https?:\/\/|data:image\/png;base64,)/.test(pic || "") ? String(pic) : "",
                score: Number(value.score || 0) || 0,
                blurb: String(value.blurb || "")
                    .replace(/<[^>]*>/g, "")
                    .replace(/\s+/g, " ")
                    .trim(),
                url:
                    typeof value.url === "string" && value.url.trim().length > 0
                        ? String(value.url)
                        : C.route("detail.v", { id: value.id })
            };
        });
}
function row(values, scope, options) {
    options = options || {};
    var requestedStyle = String(options.style || "cards");
    var style =
        ["banner", "cards", "overlay"].indexOf(requestedStyle) >= 0 ? requestedStyle : "cards";
    var portrait = style === "cards" && !!options.portrait;
    var namespace = options.namespace ? C.safe(options.namespace) + "." : "";
    var data = normalize(values, { style: style, portrait: portrait });
    if (!data.length) return [];
    return [
        {
            title: " ",
            col_type: "text_center_1",
            url: "hiker://empty",
            desc: "",
            extra: {
                id: C.ns + namespace + "carousel." + C.safe(scope),
                lineVisible: false,
                nativeCarousel: {
                    tokenKey: C.ns + namespace + "native.carousel.token.v1",
                    items: data,
                    portrait: portrait,
                    style: style,
                    height: style === "banner" ? 80 : style === "overlay" ? 200 : portrait ? 360 : 230,
                    inset: options.inset == null ? 8 : Math.max(0, Number(options.inset) || 0),
                    autoplay: options.autoplay !== false,
                    imageDecoder: typeof options.imageDecoder === "string" ? options.imageDecoder : "",
                    imageHeaders: options.imageHeaders || null
                }
            }
        }
    ];
}
function model(count) {
    var n = Math.max(0, Number(count) || 0);
    var state = { count: n, index: 0, position: n > 1 ? 1 : 0, phase: 0, disposed: false };
    state.size = function () {
        return n > 1 ? n + 2 : n;
    };
    state.indexAt = function (position) {
        return n ? (((position - (n > 1 ? 1 : 0)) % n) + n) % n : -1;
    };
    state.select = function (position) {
        state.position = Math.max(0, Math.min(state.size() - 1, position));
        state.index = state.indexAt(state.position);
        return state.index;
    };
    state.center = function () {
        return n > 1 ? state.index + 1 : 0;
    };
    state.canAdvance = function (visible) {
        return n > 1 && visible && state.phase === 0 && !state.disposed;
    };
    return state;
}
function runnable(fn) {
    return new java.lang.Runnable({
        run: function () {
            var cx = org.mozilla.javascript.Context.enter();
            try {
                cx.setLanguageVersion(200);
                fn();
            } catch (error) {
                if (typeof log === "function") log("NativeCarousel: " + error);
            } finally {
                org.mozilla.javascript.Context.exit();
            }
        }
    });
}
function create(context, spec, open, visible) {
    var Frame = android.widget.FrameLayout;
    var Linear = android.widget.LinearLayout;
    var Text = android.widget.TextView;
    var Image = android.widget.ImageView;
    var View = android.view.View;
    var Color = android.graphics.Color;
    var Gradient = android.graphics.drawable.GradientDrawable;
    var Pager = Packages.androidx.viewpager.widget.ViewPager;
    var Adapter = Packages.androidx.viewpager.widget.PagerAdapter;
    var density = context.getResources().getDisplayMetrics().density;
    function dp(v) {
        return Math.round(v * density);
    }
    // ES5 bitwise packing returns a signed ARGB int and avoids Color's float overloads.
    function argb(alpha, red, green, blue) {
        return ((alpha & 255) << 24) | ((red & 255) << 16) | ((green & 255) << 8) | (blue & 255);
    }
    function rgb(red, green, blue) {
        return argb(255, red, green, blue);
    }
    function rounded(color, radius) {
        var shape = new Gradient();
        shape["setColor(int)"](color | 0);
        shape.setCornerRadius(dp(radius));
        return shape;
    }
    var style = typeof spec !== "undefined" && spec.style ? spec.style : "cards";
    var banner = style === "banner";
    var overlay = style === "overlay";
    var inset =
        typeof spec !== "undefined" && spec.inset != null ? Math.max(0, Number(spec.inset) || 0) : 8;
    function bannerHeight(width) {
        return Math.max(dp(32), Math.round((Math.max(0, Number(width) || 0) - 2 * dp(inset)) / 4.5));
    }
    function overlayHeight(width) {
        var available = Math.max(0, Number(width) || 0) - 2 * dp(inset);
        return Math.max(dp(150), Math.round(available / 1.72));
    }
    var root = new Frame(context);
    if (banner || overlay) root.setPadding(dp(inset), 0, dp(inset), 0);
    var pager = new Pager(context);
    pager.setId(View.generateViewId());
    pager.setClipToPadding(banner || overlay);
    pager.setPageMargin(banner || overlay ? 0 : dp(6));
    if (banner || overlay) {
        // Clip the fixed viewport; page outlines move away from its edges during sliding.
        pager.setBackground(rounded(rgb(236, 236, 240), overlay ? 8 : 12));
        pager.setClipToOutline(true);
    }
    var state = model(spec.items.length);
    var handler = new android.os.Handler(android.os.Looper.getMainLooper());
    var executor = java.util.concurrent.Executors.newFixedThreadPool(2);
    var cache = {},
        pending = {},
        images = [],
        previousWidth = 0,
        connections = [];
    function loadImage(image, url) {
        images.push(image);
        if (!url) return;
        var key =
            "$" +
            JSON.stringify([
                url,
                Object.keys(spec.imageHeaders || {})
                    .sort()
                    .map(function (name) {
                        return [name, String(spec.imageHeaders[name])];
                    }),
                spec.imageDecoder || ""
            ]);
        if (cache[key]) {
            image.setImageBitmap(cache[key]);
            return;
        }
        if (pending[key]) {
            pending[key].push(image);
            return;
        }
        pending[key] = [image];
        executor.execute(
            runnable(function () {
                var conn = null,
                    input = null,
                    bitmap = null;
                try {
                    if (url.indexOf("data:image/png;base64,") === 0) {
                        var bytes = android.util.Base64.decode(url.slice(url.indexOf(",") + 1), 0);
                        if (spec.imageDecoder) {
                            input = $.require(codePath + "plugins/nativeUIkit/CommentAvatar.js").applyDecoder(
                                new java.io.ByteArrayInputStream(bytes),
                                url,
                                spec.imageHeaders,
                                spec.imageDecoder
                            );
                            bitmap = android.graphics.BitmapFactory.decodeStream(input);
                        } else
                            bitmap = android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
                        if (bitmap === null) throw new Error("Local poster body");
                    } else {
                        var target = url;
                        for (var i = 0; i <= 4; i++) {
                            if (state.disposed) return;
                            conn = new java.net.URL(target).openConnection();
                            connections.push(conn);
                            conn.setConnectTimeout(10000);
                            conn.setReadTimeout(10000);
                            conn.setInstanceFollowRedirects(false);
                            conn.setRequestProperty("User-Agent", "Mozilla/5.0");
                            Object.keys(spec.imageHeaders || {}).forEach(function (name) {
                                var value = String(spec.imageHeaders[name]);
                                if (!/[\r\n]/.test(name + value)) conn.setRequestProperty(name, value);
                            });
                            var code = conn.getResponseCode();
                            if ([301, 302, 303, 307, 308].indexOf(code) >= 0) {
                                if (i === 4) throw new Error("Poster redirect limit");
                                var next = String(
                                    new java.net.URL(new java.net.URL(target), conn.getHeaderField("Location"))
                                );
                                if (!/^https?:\/\//.test(next)) throw new Error("Poster protocol");
                                conn.disconnect();
                                conn = null;
                                target = next;
                                continue;
                            }
                            if (code !== 200 && code !== 206) throw new Error("Poster HTTP " + code);
                            input = conn.getInputStream();
                            if (spec.imageDecoder)
                                input = $.require(codePath + "plugins/nativeUIkit/CommentAvatar.js").applyDecoder(
                                    input,
                                    target,
                                    spec.imageHeaders,
                                    spec.imageDecoder
                                );
                            var opt = new android.graphics.BitmapFactory.Options();
                            opt.inSampleSize = banner ? 1 : 2;
                            opt.inPreferredConfig = banner
                                ? android.graphics.Bitmap.Config.ARGB_8888
                                : android.graphics.Bitmap.Config.RGB_565;
                            bitmap = android.graphics.BitmapFactory.decodeStream(input, null, opt);
                            if (bitmap === null) throw new Error("Poster body");
                            break;
                        }
                    }
                } finally {
                    if (input) input.close();
                    if (conn) conn.disconnect();
                    var connectionIndex = connections.indexOf(conn);
                    if (connectionIndex >= 0) connections.splice(connectionIndex, 1);
                    var result = bitmap;
                    handler.post(
                        runnable(function () {
                            var waiting = pending[key] || [];
                            delete pending[key];
                            if (state.disposed || result === null) {
                                if (result && typeof result.recycle === "function") result.recycle();
                                return;
                            }
                            cache[key] = result;
                            waiting.forEach(function (view) {
                                view.setImageBitmap(result);
                            });
                        })
                    );
                }
            })
        );
    }
    function text(value, size, color) {
        var view = new Text(context);
        view.setText(String(value));
        view.setTextSize(size);
        // SDK 36 on the target device also exposes a ColorLong overload.
        view["setTextColor(int)"](color | 0);
        view.setSingleLine(true);
        view.setEllipsize(android.text.TextUtils.TruncateAt.END);
        return view;
    }
    function card(entry) {
        var frame = new Frame(context);
        frame.setBackground(rounded(rgb(236, 236, 240), banner ? 0 : overlay ? 8 : 12));
        frame.setClipToOutline(!banner);
        var image = new Image(context);
        image.setScaleType(Image.ScaleType.CENTER_CROP);
        frame.addView(image, new Frame.LayoutParams(-1, -1));
        loadImage(image, entry.pic);
        if (!banner) {
            var caption = new Linear(context);
            caption.setOrientation(1);
            caption.setPadding(
                dp(12),
                dp(overlay ? 48 : 36),
                dp(
                    overlay ? (spec.items.length > 1 ? Math.max(88, spec.items.length * 12 + 12) : 12) : 12
                ),
                dp(12)
            );
            var colors = java.lang.reflect.Array.newInstance(java.lang.Integer.TYPE, 2);
            colors[0] = Color.TRANSPARENT;
            colors[1] = argb(overlay ? 225 : 210, 0, 0, 0);
            caption.setBackground(new Gradient(Gradient.Orientation.TOP_BOTTOM, colors));
            var title = text(entry.title, overlay ? 16 : 18, Color.WHITE);
            title.setTypeface(null, android.graphics.Typeface.BOLD);
            caption.addView(title, new Linear.LayoutParams(-1, -2));
            if (entry.blurb) {
                var blurbParams = new Linear.LayoutParams(-1, -2);
                if (overlay) blurbParams.setMargins(0, dp(3), 0, 0);
                caption.addView(text(entry.blurb, overlay ? 11 : 12, Color.WHITE), blurbParams);
            }
            var lp = new Frame.LayoutParams(-1, -2);
            lp.gravity = 80;
            frame.addView(caption, lp);
            if (!overlay && entry.score > 0) {
                var score = text(entry.score.toFixed(1), 14, rgb(255, 209, 106));
                score.setPadding(dp(6), dp(2), dp(6), dp(2));
                score.setBackground(rounded(argb(100, 0, 0, 0), 5));
                var sp = new Frame.LayoutParams(-2, -2);
                sp.gravity = 53;
                sp.setMargins(0, dp(9), dp(9), 0);
                frame.addView(score, sp);
            }
        }
        frame.setOnClickListener(
            new View.OnClickListener({
                onClick: function (view) {
                    if (!state.disposed && state.phase === 0) open(entry, view);
                }
            })
        );
        return frame;
    }
    var showIndicator = spec.items.length > 1;
    var dots = new Linear(context);
    dots.setOrientation(0);
    dots.setGravity(17);
    function paintDots() {
        for (var i = 0; i < dots.getChildCount(); i++) {
            var dot = dots.getChildAt(i).getChildAt(0),
                selected = i === state.index;
            var color =
                banner || overlay
                    ? selected
                        ? rgb(255, 255, 255)
                        : argb(90, 255, 255, 255)
                    : selected
                        ? rgb(236, 99, 142)
                        : rgb(183, 183, 189);
            dot.setBackground(rounded(color, 4));
            var params = dot.getLayoutParams();
            params.width = dp(overlay ? 6 : !banner && selected ? 14 : 5);
            dot.setLayoutParams(params);
        }
    }
    for (var i = 0; showIndicator && i < spec.items.length; i++) {
        (function (index) {
            // The visible glyph stays small; its whole indicator cell accepts taps.
            var target = new Frame(context);
            var dot = new View(context);
            var glyphParams = new Frame.LayoutParams(dp(overlay ? 6 : 5), dp(overlay ? 6 : 5));
            glyphParams.gravity = 17;
            target.addView(dot, glyphParams);
            dots.addView(target, new Linear.LayoutParams(dp(banner || overlay ? 12 : 20), dp(28)));
            target.setOnClickListener(
                new View.OnClickListener({
                    onClick: function () {
                        if (state.disposed) return;
                        pager.setCurrentItem(spec.items.length > 1 ? index + 1 : 0, true);
                        // Give a manual selection a full interval before the next automatic change.
                        handler.removeCallbacks(tick);
                        if (spec.autoplay !== false && spec.items.length > 1) handler.postDelayed(tick, 4000);
                    }
                })
            );
        })(i);
    }
    var adapter = new JavaAdapter(Adapter, {
        getCount: function () {
            return state.size();
        },
        isViewFromObject: function (view, object) {
            return view.equals(object);
        },
        instantiateItem: function (container, position) {
            var view = card(spec.items[state.indexAt(position)]);
            container.addView(view);
            return view;
        },
        destroyItem: function (container, position, object) {
            container.removeView(object);
            var picture = object.getChildAt(0);
            images = images.filter(function (image) {
                return !image.equals(picture);
            });
            Object.keys(pending).forEach(function (key) {
                pending[key] = pending[key].filter(function (image) {
                    return !image.equals(picture);
                });
            });
            picture.setImageDrawable(null);
        }
    });
    pager.setAdapter(adapter);
    pager.addOnPageChangeListener(
        new Pager.OnPageChangeListener({
            onPageScrolled: function () { },
            onPageSelected: function (position) {
                state.select(position);
                paintDots();
            },
            onPageScrollStateChanged: function (phase) {
                state.phase = Number(phase);
                if (phase === 0 && !state.disposed && state.position !== state.center())
                    pager.setCurrentItem(state.center(), false);
            }
        })
    );
    pager.setPageTransformer(
        false,
        new Pager.PageTransformer({
            transformPage: function (view, position) {
                view.setAlpha(banner || overlay || Math.abs(position) < 0.01 ? 1 : 0.8);
            }
        })
    );
    root.addView(
        pager,
        new Frame.LayoutParams(
            -1,
            banner || overlay ? -1 : dp(spec.height - (showIndicator ? 28 : 0))
        )
    );
    if (showIndicator) {
        var dotParams = new Frame.LayoutParams(banner || overlay ? -2 : -1, dp(28));
        dotParams.gravity = banner || overlay ? 85 : 80;
        if (banner || overlay) dotParams.setMargins(0, 0, dp(6), 0);
        root.addView(dots, dotParams);
    }
    var layout = new View.OnLayoutChangeListener({
        onLayoutChange: function () {
            var width = root.getWidth();
            if (width <= 0 || width === previousWidth) return;
            previousWidth = width;
            var padding = banner || overlay ? 0 : Math.round(width * (spec.portrait ? 0.14 : 0.06));
            pager.setPadding(padding, 0, padding, 0);
            if (banner || overlay) {
                var params = root.getLayoutParams();
                var height = banner ? bannerHeight(width) : overlayHeight(width);
                if (params && params.height !== height) {
                    params.height = height;
                    root.setLayoutParams(params);
                }
            }
        }
    });
    root.addOnLayoutChangeListener(layout);
    pager.setCurrentItem(state.position, false);
    paintDots();
    var tick = runnable(function () {
        if (state.disposed) return;
        if (spec.autoplay !== false && state.canAdvance(visible()))
            pager.setCurrentItem(state.position + 1, true);
        handler.postDelayed(tick, 4000);
    });
    if (spec.autoplay !== false && spec.items.length > 1) handler.postDelayed(tick, 4000);
    return {
        view: root,
        state: state,
        pager: pager,
        measureHeight: banner ? bannerHeight : overlay ? overlayHeight : null,
        destroy: function () {
            if (state.disposed) return;
            state.disposed = true;
            handler.removeCallbacksAndMessages(null);
            executor.shutdownNow();
            connections.forEach(function (conn) {
                try {
                    conn.disconnect();
                } catch (ignore) { }
            });
            connections = [];
            root.removeOnLayoutChangeListener(layout);
            pager.clearOnPageChangeListeners();
            pager.setAdapter(null);
            images.forEach(function (image) {
                image.setImageDrawable(null);
            });
            images = [];
            pending = {};
            Object.keys(cache).forEach(function (key) {
                var bitmap = cache[key];
                if (
                    bitmap &&
                    typeof bitmap.recycle === "function" &&
                    (!bitmap.isRecycled || !bitmap.isRecycled())
                )
                    bitmap.recycle();
            });
            cache = {};
        }
    };
}
function context() {
    try {
        return typeof getCurrentActivity === "function"
            ? getCurrentActivity()
            : com.example.hikerview.ui.ActivityManager.getInstance().getCurrentActivity();
    } catch (ignore) {
        // Restricted screens (for example the rule editor) are not mounting targets.
        return null;
    }
}
function field(object, name) {
    var cls = object.getClass();
    while (cls) {
        try {
            var f = cls.getDeclaredField(name);
            f.setAccessible(true);
            return f.get(object);
        } catch (ignore) {
            cls = cls.getSuperclass();
        }
    }
    return null;
}
function host(activity) {
    var fragment = field(activity, "articleListFragment");
    if (!fragment) {
        var adapter = field(activity, "viewPagerAdapter");
        if (adapter) {
            // Rhino can hide methods whose declaring Java class is non-public.
            var getter = adapter.getClass().getMethod("getCurrentFragment");
            getter.setAccessible(true);
            fragment = getter.invoke(adapter);
        }
    }
    var root = fragment ? field(fragment, "convertView") : null;
    var recycler = root
        ? root.findViewById(com.example.hikerview.R.id.frag_article_list_recycler_view)
        : null;
    return { fragment: fragment, recycler: recycler };
}
function closeKey(activeKey) {
    return C.ns + "native.carousel.page.v1" + activeKey.slice(activeKey.lastIndexOf(".activity."));
}
function registerTicket(activeKey, ticket) {
    var key = closeKey(activeKey);
    var previous = getMyVar(key, "");
    var tickets = previous ? JSON.parse(previous) : {};
    tickets[activeKey] = ticket;
    putMyVar(key, JSON.stringify(tickets));
    // Page variables survive module re-evaluation; the close action reads the latest tickets.
    if (!previous && typeof addListener === "function")
        addListener(
            "onClose",
            $.toString(function (key) {
                var tickets = JSON.parse(getMyVar(key, "") || "{}");
                putMyVar(key, "");
                var api = $.require(codePath + "plugins/nativeUIkit/NativeCarousel.js");
                Object.keys(tickets).forEach(function (activeKey) {
                    api.release(tickets[activeKey]);
                });
            }, key)
        );
}
function forgetTicket(activeKey, ticket) {
    var indexKey = closeKey(activeKey);
    var text = getMyVar(indexKey, "");
    if (text) {
        var tickets = JSON.parse(text);
        if (tickets[activeKey] === ticket) delete tickets[activeKey];
        putMyVar(indexKey, JSON.stringify(tickets));
    }
}
function release(ticket, namespace) {
    var key = namespace ? C.ns + C.safe(namespace) + ".native.carousel.token.v1" : tokenKey;
    if (ticket && String(ticket).indexOf("\n") >= 0) key = String(ticket).split("\n")[0];
    if (key.indexOf(C.ns) !== 0) return;
    if (!ticket) key = pageKey(key, context());
    if (ticket && getMyVar(key, "") !== ticket) return;
    var released = ticket || getMyVar(key, "");
    putMyVar(key, "");
    putMyVar(key + ".update.v1", "");
    forgetTicket(key, released);
    hostManagers.slice().forEach(function (manager) {
        manager.activity.runOnUiThread(
            runnable(function () {
                manager.release(key, released);
            })
        );
    });
}
// Ticket-bound data survives offscreen rows and delayed initial binding.
function update(rowItem, scope) {
    var spec = rowItem && rowItem.extra && rowItem.extra.nativeView;
    if (!spec) return false;
    var activity = context();
    var key = pageKey(spec.tokenKey || tokenKey, activity);
    var ticket = getMyVar(key, "");
    if (!ticket || ticket.indexOf(key + "\n" + scope + ".") !== 0) return false;
    putMyVar(
        key + ".update.v1",
        JSON.stringify({ ticket: ticket, id: rowItem.extra.id, spec: spec })
    );
    activity.runOnUiThread(
        runnable(function () {
            if (getMyVar(key, "") !== ticket || activity.isFinishing() || activity.isDestroyed())
                return;
            var h = host(activity);
            if (!h.recycler) return;
            for (var i = 0; i < h.recycler.getChildCount(); i++) {
                var row = h.recycler.getChildAt(i);
                if (!(row instanceof android.view.ViewGroup)) continue;
                for (var j = 0; j < row.getChildCount(); j++) {
                    var tag = row.getChildAt(j).getTag();
                    if (
                        tag instanceof java.util.Map &&
                        String(tag.get("ticket")) === ticket &&
                        tag.get("update")
                    )
                        tag.get("update").run();
                }
            }
        })
    );
    return true;
}
function pageKey(key, activity) {
    return key + ".activity." + java.lang.System.identityHashCode(activity);
}
var hostManagers = [];
// One host lookup, listener pair and visible-row index per Activity, regardless of card count.
function sharedHost(activity) {
    for (var i = 0; i < hostManagers.length; i++) {
        if (hostManagers[i].activity.equals(activity)) return hostManagers[i];
    }
    var handler = new android.os.Handler(android.os.Looper.getMainLooper());
    var members = [],
        h = null,
        stopped = false,
        scanning = false;
    function disconnect() {
        if (!h || !h.recycler) return;
        h.recycler.removeOnChildAttachStateChangeListener(attach);
        h.recycler.getViewTreeObserver().removeOnGlobalLayoutListener(layout);
    }
    function stop() {
        if (stopped) return;
        stopped = true;
        handler.removeCallbacksAndMessages(null);
        disconnect();
        h = null;
        hostManagers = hostManagers.filter(function (value) {
            return value !== manager;
        });
    }
    function each(fn) {
        members.slice().forEach(function (member) {
            if (!member.current()) member.dispose();
            else {
                try {
                    fn(member);
                } catch (error) {
                    member.failure(error);
                }
            }
        });
    }
    function foreground() {
        if (stopped) return false;
        try {
            var current = context();
            return !!current && current.equals(activity);
        } catch (ignore) {
            return false;
        }
    }
    function rowId(view, adapter, list, offset) {
        var position = h.recycler.getChildAdapterPosition(view) - offset;
        if (position < 0 || position >= list.size()) return "";
        return String(list.get(position).getBaseExtra().getId() || "");
    }
    function scan() {
        if (scanning || !foreground() || !h || !h.recycler) return;
        scanning = true;
        try {
            var views = {},
                adapter = h.recycler.getAdapter();
            if (!adapter) return;
            var list = adapter.getList();
            var offset =
                typeof adapter.getHeaderLayoutCount === "function" ? adapter.getHeaderLayoutCount() : 0;
            for (var i = 0; i < h.recycler.getChildCount(); i++) {
                var view = h.recycler.getChildAt(i);
                views["$" + rowId(view, adapter, list, offset)] = view;
            }
            each(function (member) {
                member.sync(h, views["$" + member.id] || null);
            });
        } finally {
            scanning = false;
        }
    }
    var attach =
        new Packages.androidx.recyclerview.widget.RecyclerView.OnChildAttachStateChangeListener({
            onChildViewAttachedToWindow: function (view) {
                if (!foreground() || !h || !h.recycler) return;
                if (!view) {
                    scan();
                    return;
                }
                var adapter = h.recycler.getAdapter();
                if (!adapter) return;
                var list = adapter.getList();
                var offset =
                    typeof adapter.getHeaderLayoutCount === "function" ? adapter.getHeaderLayoutCount() : 0;
                var id = rowId(view, adapter, list, offset);
                each(function (member) {
                    if (member.id === id) member.sync(h, view);
                });
            },
            onChildViewDetachedFromWindow: function (view) {
                each(function (member) {
                    member.detach(view);
                });
            }
        });
    var layout = new android.view.ViewTreeObserver.OnGlobalLayoutListener({ onGlobalLayout: scan });
    var watch = runnable(function () {
        each(function () { });
        if (stopped) return;
        var delay = 500;
        try {
            if (foreground()) {
                var next = host(activity);
                if (!h || !h.recycler || !next.recycler || !h.recycler.equals(next.recycler)) {
                    disconnect();
                    each(function (member) {
                        member.detachHost();
                    });
                    h = next;
                    if (h.recycler) {
                        h.recycler.addOnChildAttachStateChangeListener(attach);
                        h.recycler.getViewTreeObserver().addOnGlobalLayoutListener(layout);
                    }
                } else h = next;
                if (!h.recycler) {
                    delay = 100;
                    each(function (member) {
                        member.missing();
                    });
                } else scan();
            }
        } catch (error) {
            each(function (member) {
                member.failure(error);
            });
        }
        if (!stopped) handler.postDelayed(watch, delay);
    });
    var manager = {
        activity: activity,
        add: function (member) {
            members.push(member);
            members.slice().forEach(function (previous) {
                if (previous !== member && previous.key === member.key) previous.dispose();
            });
            handler.removeCallbacks(watch);
            handler.post(watch);
        },
        release: function (key, ticket) {
            members.slice().forEach(function (member) {
                if (member.key === key && member.ticket === ticket) member.dispose();
            });
        },
        remove: function (member) {
            members = members.filter(function (value) {
                return value !== member;
            });
            if (!members.length) stop();
        }
    };
    hostManagers.push(manager);
    return manager;
}
function mount(rowItem, scope, factory) {
    if (
        !rowItem ||
        !rowItem.extra ||
        !(rowItem.extra.nativeCarousel || rowItem.extra.nativeIconMenu || rowItem.extra.nativeView)
    ) {
        release();
        return;
    }
    var spec =
        rowItem.extra.nativeCarousel || rowItem.extra.nativeIconMenu || rowItem.extra.nativeView;
    var makeView = typeof factory === "function" ? factory : create;
    var activity = context();
    if (!activity) return;
    // 同一文章可以出现在多个页面；子页面挂载/关闭只处理自己的宿主。
    var activeKey = pageKey(spec.tokenKey || tokenKey, activity);
    var ticket = activeKey + "\n" + scope + "." + Date.now() + "." + Math.random();
    putMyVar(activeKey, ticket);
    putMyVar(activeKey + ".update.v1", "");
    registerTicket(activeKey, ticket);
    activity.runOnUiThread(
        runnable(function () {
            // Skip work invalidated while waiting for the UI queue during a fast category switch.
            if (getMyVar(activeKey, "") !== ticket || activity.isFinishing() || activity.isDestroyed())
                return;
            var manager = sharedHost(activity);
            var h = null,
                widget = null,
                record = null,
                disposed = false,
                attempts = 0;
            function current() {
                return (
                    !disposed &&
                    getMyVar(activeKey, "") === ticket &&
                    !activity.isFinishing() &&
                    !activity.isDestroyed()
                );
            }
            var appliedUpdate = "";
            function syncUpdate() {
                if (!current()) return;
                var text = getMyVar(activeKey + ".update.v1", "");
                if (!text || text === appliedUpdate) return;
                var value = JSON.parse(text);
                if (
                    value.ticket !== ticket ||
                    value.id !== rowItem.extra.id ||
                    !value.spec ||
                    value.spec.kind !== spec.kind
                )
                    return;
                if (widget && typeof widget.update !== "function") return;
                if (widget && widget.update(value.spec) === false) return;
                spec = value.spec;
                appliedUpdate = text;
                // Re-measure so the host row grows/shrinks with the appended content.
                if (widget && record && typeof widget.measureHeight === "function") {
                    var metrics = activity.getResources().getDisplayMetrics();
                    var width =
                        record.view.getWidth() ||
                        (h && h.recycler && h.recycler.getWidth()) ||
                        metrics.widthPixels ||
                        360 * metrics.density;
                    var height = widget.wrapContent ? -2 : widget.measureHeight(width);
                    var widgetParams = widget.view.getLayoutParams();
                    if (widgetParams && widgetParams.height !== height) {
                        widgetParams.height = height;
                        widget.view.setLayoutParams(widgetParams);
                    }
                    var lp = record.view.getLayoutParams();
                    if (lp && lp.height !== height) {
                        lp.height = height;
                        record.view.setLayoutParams(lp);
                    }
                    if (record.view.getMinimumHeight() !== Math.max(0, height))
                        record.view.setMinimumHeight(Math.max(0, height));
                }
            }
            function restore() {
                if (!record) return;
                if (widget && widget.view.getParent()) widget.view.getParent().removeView(widget.view);
                // Opt-in only: release post thumbnails while retaining text and layout state.
                if (widget && typeof widget.suspend === "function") widget.suspend();
                record.children.forEach(function (child) {
                    child.view.setVisibility(child.visibility);
                });
                var lp = record.view.getLayoutParams();
                lp.height = record.height;
                record.view.setLayoutParams(lp);
                record.view.setPadding(
                    record.padding[0],
                    record.padding[1],
                    record.padding[2],
                    record.padding[3]
                );
                record.view.setMinimumHeight(record.minimum);
                record = null;
            }
            function dispose() {
                if (disposed) return;
                disposed = true;
                forgetTicket(activeKey, ticket);
                try {
                    restore();
                } finally {
                    try {
                        if (widget) widget.destroy();
                    } finally {
                        widget = null;
                        h = null;
                        manager.remove(member);
                    }
                }
            }
            function visible() {
                return (
                    current() &&
                    record !== null &&
                    manager.activity.equals(context()) &&
                    activity.hasWindowFocus() &&
                    widget.view.isShown() &&
                    widget.view.getGlobalVisibleRect(new android.graphics.Rect())
                );
            }
            function open(entry, view) {
                if (!entry || !entry.url || !visible() || !h.fragment) return;
                var position = h.recycler.getChildAdapterPosition(record.view);
                if (position < 0 || itemId(record.view) !== rowItem.extra.id) return;
                var click = h.fragment
                    .getClass()
                    .getDeclaredMethod(
                        "clickItem",
                        android.view.View,
                        java.lang.Integer.TYPE,
                        java.lang.String,
                        java.lang.Boolean.TYPE,
                        java.lang.String
                    );
                click.setAccessible(true);
                click.invoke(
                    h.fragment,
                    view,
                    java.lang.Integer.valueOf(position),
                    entry.url,
                    java.lang.Boolean.TRUE,
                    ""
                );
            }
            // Use the original row listener so menus stay owned by the calling rule.
            function longPress() {
                if (!visible()) return false;
                // Only ActionBar opts into the client default menu; other kinds keep their old gate.
                if (
                    spec.kind !== "actionBar" &&
                    (!rowItem.extra.longClick || !rowItem.extra.longClick.length)
                )
                    return false;
                if (itemId(record.view) !== rowItem.extra.id) return false;
                return record.view.performLongClick() === true;
            }
            function itemId(view) {
                var position = h.recycler.getChildAdapterPosition(view),
                    adapter = h.recycler.getAdapter();
                if (position < 0 || !adapter) return "";
                var offset =
                    typeof adapter.getHeaderLayoutCount === "function" ? adapter.getHeaderLayoutCount() : 0;
                var list = adapter.getList();
                position -= offset;
                if (position < 0 || position >= list.size()) return "";
                return String(list.get(position).getBaseExtra().getId() || "");
            }
            // 返回或重绑定后恢复宿主布局，保留已经展开的卡片实例。
            function applyHost(view) {
                var metrics = activity.getResources().getDisplayMetrics();
                var measured = typeof widget.measureHeight === "function";
                var width = measured
                    ? view.getWidth() ||
                    h.recycler.getWidth() ||
                    metrics.widthPixels ||
                    360 * metrics.density
                    : 0;
                var height = widget.wrapContent
                    ? -2
                    : measured
                        ? widget.measureHeight(width)
                        : Math.round(spec.height * metrics.density);
                if (measured) {
                    var widgetParams = widget.view.getLayoutParams();
                    if (widgetParams && widgetParams.height !== height) {
                        widgetParams.height = height;
                        widget.view.setLayoutParams(widgetParams);
                    }
                }
                var lp = view.getLayoutParams();
                if (lp.height !== height) {
                    lp.height = height;
                    view.setLayoutParams(lp);
                }
                if (view.getMinimumHeight() !== Math.max(0, height))
                    view.setMinimumHeight(Math.max(0, height));
                if (
                    view.getPaddingLeft() ||
                    view.getPaddingTop() ||
                    view.getPaddingRight() ||
                    view.getPaddingBottom()
                )
                    view.setPadding(0, 0, 0, 0);
                for (var i = 0; i < view.getChildCount(); i++) {
                    var child = view.getChildAt(i);
                    if (child.equals(widget.view)) continue;
                    var known = record.children.some(function (value) {
                        return value.view.equals(child);
                    });
                    if (!known) record.children.push({ view: child, visibility: child.getVisibility() });
                    if (child.getVisibility() !== 8) child.setVisibility(8);
                }
                return height;
            }
            function bind(view) {
                syncUpdate();
                if (
                    record &&
                    record.view.equals(view) &&
                    widget.view.getParent() &&
                    widget.view.getParent().equals(view)
                ) {
                    applyHost(view);
                    if (typeof widget.resume === "function") widget.resume();
                    return;
                }
                restore();
                if (!(view instanceof android.view.ViewGroup))
                    throw new Error("Carousel row is not a ViewGroup");
                // Dispose an earlier mount synchronously before taking the row snapshot.
                // Its delayed restore must never resize or reveal children in the new mount.
                for (var oldIndex = view.getChildCount() - 1; oldIndex >= 0; oldIndex--) {
                    var tag = view.getChildAt(oldIndex).getTag();
                    if (
                        tag instanceof java.util.Map &&
                        String(tag.get("owner")) === C.ns + "native.carousel.host.v1"
                    ) {
                        tag.get("dispose").run();
                    }
                }
                if (!widget) widget = makeView(activity, spec, open, visible, longPress);
                var lp = view.getLayoutParams(),
                    children = [];
                for (var i = 0; i < view.getChildCount(); i++) {
                    var child = view.getChildAt(i);
                    children.push({ view: child, visibility: child.getVisibility() });
                }
                record = {
                    view: view,
                    height: lp.height,
                    minimum: view.getMinimumHeight(),
                    padding: [
                        view.getPaddingLeft(),
                        view.getPaddingTop(),
                        view.getPaddingRight(),
                        view.getPaddingBottom()
                    ],
                    children: children
                };
                var height = applyHost(view);
                var params;
                if (view instanceof android.widget.FrameLayout)
                    params = new android.widget.FrameLayout.LayoutParams(-1, height);
                else if (view instanceof android.widget.LinearLayout)
                    params = new android.widget.LinearLayout.LayoutParams(-1, height);
                else if (view instanceof android.widget.RelativeLayout)
                    params = new android.widget.RelativeLayout.LayoutParams(-1, height);
                else throw new Error("Unsupported carousel row layout " + view.getClass().getName());
                var ownership = new java.util.HashMap();
                ownership.put("owner", C.ns + "native.carousel.host.v1");
                ownership.put("dispose", runnable(dispose));
                ownership.put("ticket", ticket);
                ownership.put("update", runnable(syncUpdate));
                widget.view.setTag(ownership);
                view.addView(widget.view, params);
                if (typeof widget.resume === "function") widget.resume();
            }
            function failure(error) {
                dispose();
                if (typeof log === "function") log("NativeCarousel mount: " + error);
                if (getMyVar(activeKey, "") === ticket && typeof updateItem === "function")
                    updateItem(rowItem.extra.id, {
                        title: spec.errorTitle || "轮播加载失败",
                        desc: String(error.message || error),
                        extra: { id: rowItem.extra.id, lineVisible: false }
                    });
            }
            var member = {
                id: rowItem.extra.id,
                key: activeKey,
                ticket: ticket,
                current: current,
                dispose: dispose,
                failure: failure,
                sync: function (next, found) {
                    h = next;
                    attempts = 0;
                    syncUpdate();
                    if (record && (!found || !record.view.equals(found))) restore();
                    if (found) bind(found);
                },
                detach: function (view) {
                    if (record && record.view.equals(view)) restore();
                },
                detachHost: restore,
                missing: function () {
                    if (++attempts >= 30) throw new Error("Carousel list host unavailable");
                }
            };
            manager.add(member);
        })
    );
    return ticket;
}
$.exports = {
    imageDecoderVersion: 1,
    normalize: normalize,
    row: row,
    model: model,
    create: create,
    mount: mount,
    update: update,
    release: release
};
