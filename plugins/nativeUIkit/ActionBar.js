// by:鬼佬的原生组件工坊
var C = $.require(codePath + "plugins/nativeUIkit/Config.js");
var Host = $.require(codePath + "plugins/nativeUIkit/NativeCarousel.js");
var Pictures = $.require(codePath + "plugins/nativeUIkit/CommentAvatar.js");
function text(value) {
    return typeof value === "string" ? value.replace(/^\s+|\s+$/g, "") : "";
}
function number(value, fallback, min, max) {
    var n = Number(value);
    return value !== null && value !== undefined && value !== "" && isFinite(n)
        ? Math.max(min, Math.min(max, n))
        : fallback;
}
function normalize(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    var left = value.left || {},
        right = value.right || {};
    var title = text(left.title),
        action = text(right.text),
        icon = text(left.icon);
    if (!title && !action) return null;
    return {
        id: text(value.id) || "action",
        left: {
            title: title,
            subtitle: text(left.subtitle),
            icon: /^(https?:\/\/|file:\/\/|data:image\/(png|jpeg|webp|gif);base64,)/.test(icon)
                ? icon
                : "",
            iconText: text(left.iconText).slice(0, 4),
            url: text(left.url)
        },
        right: { text: action, url: text(right.url) }
    };
}
function settings(options) {
    options = options || {};
    var headers = {};
    Object.keys(options.imageHeaders || {}).forEach(function (key) {
        headers[key] = String(options.imageHeaders[key]);
    });
    function color(value, fallback) {
        return /^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i.test(String(value || "")) ? String(value) : fallback;
    }
    return {
        height: number(options.height, 64, 40, 120),
        inset: number(options.inset, 16, 0, 40),
        iconSize: number(options.iconSize, 32, 16, 56),
        iconShape: /^(circle|rounded|square)$/.test(options.iconShape) ? options.iconShape : "circle",
        iconRadius: number(options.iconRadius, 8, 0, 28),
        titleSize: number(options.titleSize, 16, 12, 24),
        subtitleSize: number(options.subtitleSize, 12, 10, 18),
        actionSize: number(options.actionSize, 14, 12, 22),
        titleColor: color(options.titleColor, "#242424"),
        subtitleColor: color(options.subtitleColor, "#8E8E93"),
        actionColor: color(options.actionColor, color(options.titleColor, "#242424")),
        background: color(options.background, "#FFFFFF"),
        imageDecoder: typeof options.imageDecoder === "string" ? options.imageDecoder : "",
        imageHeaders: headers
    };
}
function row(value, scope, options) {
    var item = normalize(value);
    if (!item) return [];
    options = options || {};
    var id =
        C.ns +
        (options.namespace ? C.safe(options.namespace) + "." : "") +
        "actionBar." +
        C.safe(scope || "default");
    var spec = settings(options);
    spec.kind = "actionBar";
    spec.item = item;
    spec.tokenKey = id + ".token.v1";
    spec.errorTitle = "双端操作栏加载失败";
    var extra = { id: id, lineVisible: false, nativeView: spec };
    // Keep row-menu metadata out of the native view spec; preserve serialized callbacks verbatim.
    if (Array.isArray(value.longClick)) extra.longClick = value.longClick.slice();
    return [
        {
            title: item.left.title || item.right.text,
            col_type: "text_center_1",
            url: "hiker://empty",
            extra: extra
        }
    ];
}
function create(context, spec, open, visible, longPress) {
    var Linear = android.widget.LinearLayout,
        Frame = android.widget.FrameLayout;
    var Text = android.widget.TextView,
        Image = android.widget.ImageView,
        View = android.view.View;
    var Color = android.graphics.Color;
    var density = context.getResources().getDisplayMetrics().density;
    var state = { disposed: false, suspended: false },
        item = spec.item,
        options = settings(spec);
    var job = null,
        lastWidth = 0,
        longViews = [];
    Pictures.retainPosts();
    function dp(value) {
        return Math.round(value * density);
    }
    function label(size) {
        var view = new Text(context);
        view.setTextSize(size);
        view.setSingleLine(true);
        view.setEllipsize(android.text.TextUtils.TruncateAt.END);
        view.setGravity(19);
        return view;
    }
    function shape(color, radius) {
        var value = new android.graphics.drawable.GradientDrawable();
        value["setColor(int)"](Color.parseColor(color) | 0);
        value.setCornerRadius(dp(radius));
        return value;
    }
    var root = new Linear(context);
    root.setOrientation(0);
    root.setGravity(16);
    var leftSlot = new Frame(context);
    var weighted = new Linear.LayoutParams(0, -1);
    weighted.weight = 1;
    root.addView(leftSlot, weighted);
    var leftTarget = new Linear(context);
    leftTarget.setOrientation(0);
    leftTarget.setGravity(16);
    var leftParams = new Frame.LayoutParams(-2, -1);
    leftParams.gravity = 3;
    leftSlot.addView(leftTarget, leftParams);
    var iconBox = new Frame(context);
    var placeholder = label(16);
    placeholder.setGravity(17);
    iconBox.addView(placeholder, new Frame.LayoutParams(-1, -1));
    var icon = new Image(context);
    icon.setScaleType(Image.ScaleType.CENTER_CROP);
    iconBox.addView(icon, new Frame.LayoutParams(-1, -1));
    leftTarget.addView(
        iconBox,
        new Linear.LayoutParams(dp(options.iconSize), dp(options.iconSize))
    );
    var names = new Linear(context);
    names.setOrientation(1);
    names.setGravity(16);
    var namesParams = new Linear.LayoutParams(-2, -2);
    leftTarget.addView(names, namesParams);
    var title = label(options.titleSize),
        subtitle = label(options.subtitleSize);
    names.addView(title, new Linear.LayoutParams(-2, -2));
    names.addView(subtitle, new Linear.LayoutParams(-2, -2));
    var spacer = new View(context);
    root.addView(spacer, new Linear.LayoutParams(dp(8), 1));
    var rightTarget = label(options.actionSize);
    rightTarget.setGravity(21);
    rightTarget.setPadding(dp(8), 0, 0, 0);
    rightTarget.setMinimumWidth(dp(48));
    root.addView(rightTarget, new Linear.LayoutParams(-2, -1));
    function active() {
        return !state.disposed && !state.suspended && (!visible || visible());
    }
    function hold(target) {
        return active() && typeof longPress === "function" && longPress(target) === true;
    }
    function longClick(view) {
        if (typeof longPress !== "function") return;
        view.setOnLongClickListener(
            new View.OnLongClickListener({
                onLongClick: hold,
                // Original row owns its native menu and haptic feedback.
                onLongClickUseDefaultHapticFeedback: function () {
                    return false;
                }
            })
        );
        longViews.push(view);
    }
    function bind(view, side) {
        var value = item[side];
        var hasText = side === "left" ? !!value.title : !!value.text;
        view.setOnClickListener(
            hasText && value.url
                ? new View.OnClickListener({
                    onClick: function (target) {
                        if (active()) open({ id: item.id, side: side, url: item[side].url }, target);
                    }
                })
                : null
        );
    }
    function stopImage() {
        if (job) job.destroy();
        job = null;
        icon.setImageDrawable(null);
    }
    function loadImage() {
        stopImage();
        placeholder.setVisibility(0);
        icon.setVisibility(8);
        if (!item.left.icon || state.disposed || state.suspended) return;
        var target = { width: dp(options.iconSize), height: dp(options.iconSize), maxPixels: 65536 };
        if (options.imageDecoder) target.decoderModule = options.imageDecoder;
        job = Pictures.load(item.left.icon, icon, placeholder, options.imageHeaders, target, {
            post: true,
            context: context
        });
    }
    function measure(width) {
        lastWidth = Math.max(
            1,
            Math.round(
                Number(width) || Number(context.getResources().getDisplayMetrics().widthPixels) || dp(360)
            )
        );
        var available = Math.max(1, lastWidth - dp(options.inset * 2));
        var actionWidth = item.right.text
            ? Math.min(
                Math.floor(available * 0.45),
                Math.max(dp(48), Math.ceil(rightTarget.getPaint().measureText(item.right.text)) + dp(8))
            )
            : 0;
        rightTarget.setMaxWidth(Math.max(1, actionWidth));
        var iconWidth = item.left.icon || item.left.iconText ? dp(options.iconSize + 10) : 0;
        var textWidth = Math.max(
            1,
            available - actionWidth - (item.right.text ? dp(8) : 0) - iconWidth
        );
        title.setMaxWidth(textWidth);
        subtitle.setMaxWidth(textWidth);
        return dp(options.height);
    }
    function paint() {
        root.setPadding(dp(options.inset), 0, dp(options.inset), 0);
        root.setMinimumHeight(dp(options.height));
        root.setBackground(shape(options.background, 0));
        title.setText(item.left.title);
        title.setTextSize(options.titleSize);
        title["setTextColor(int)"](Color.parseColor(options.titleColor) | 0);
        subtitle.setText(item.left.subtitle);
        subtitle.setTextSize(options.subtitleSize);
        subtitle["setTextColor(int)"](Color.parseColor(options.subtitleColor) | 0);
        subtitle.setVisibility(item.left.subtitle ? 0 : 8);
        rightTarget.setText(item.right.text);
        rightTarget.setTextSize(options.actionSize);
        rightTarget["setTextColor(int)"](Color.parseColor(options.actionColor) | 0);
        rightTarget.setVisibility(item.right.text ? 0 : 8);
        spacer.setVisibility(item.right.text ? 0 : 8);
        leftTarget.setVisibility(item.left.title ? 0 : 8);
        iconBox.setVisibility(item.left.icon || item.left.iconText ? 0 : 8);
        iconBox.setLayoutParams(new Linear.LayoutParams(dp(options.iconSize), dp(options.iconSize)));
        placeholder.setText(item.left.iconText);
        placeholder["setTextColor(int)"](Color.parseColor(options.actionColor) | 0);
        // Clip the common container so downloaded images and text share the same outline.
        var radius =
            options.iconShape === "circle"
                ? dp(options.iconSize) / 2
                : options.iconShape === "rounded"
                    ? Math.min(dp(options.iconSize) / 2, dp(options.iconRadius))
                    : 0;
        var iconBackground = shape("#F2F2F4", 0);
        iconBackground.setCornerRadius(radius);
        iconBox.setBackground(iconBackground);
        iconBox.setClipToOutline(radius > 0);
        namesParams.setMargins(item.left.icon || item.left.iconText ? dp(10) : 0, 0, 0, 0);
        names.setLayoutParams(namesParams);
        bind(leftTarget, "left");
        bind(rightTarget, "right");
        measure(lastWidth);
    }
    longClick(root);
    longClick(leftTarget);
    longClick(rightTarget);
    paint();
    loadImage();
    return {
        view: root,
        state: state,
        measureHeight: measure,
        update: function (nextSpec) {
            if (state.disposed) return false;
            var next = normalize(nextSpec.item),
                nextOptions = settings(nextSpec);
            if (!next || next.id !== item.id) return false;
            var reload =
                next.left.icon !== item.left.icon ||
                nextOptions.iconSize !== options.iconSize ||
                nextOptions.imageDecoder !== options.imageDecoder ||
                JSON.stringify(nextOptions.imageHeaders) !== JSON.stringify(options.imageHeaders);
            item = next;
            options = nextOptions;
            paint();
            if (reload) loadImage();
            return true;
        },
        suspend: function () {
            if (state.disposed || state.suspended) return;
            state.suspended = true;
            stopImage();
        },
        resume: function () {
            if (state.disposed || !state.suspended) return;
            state.suspended = false;
            loadImage();
        },
        destroy: function () {
            if (state.disposed) return;
            state.disposed = true;
            leftTarget.setOnClickListener(null);
            rightTarget.setOnClickListener(null);
            longViews.forEach(function (view) {
                view.setOnLongClickListener(null);
            });
            longViews = [];
            stopImage();
            Pictures.releasePosts();
        }
    };
}
function mount(item, scope) {
    if (
        !item ||
        !item.extra ||
        !item.extra.nativeView ||
        item.extra.nativeView.kind !== "actionBar"
    )
        return;
    return Host.mount(item, scope, create);
}
function demoButton(label) {
    return {
        title: String(label || "双端操作栏"),
        col_type: "text_center_1",
        url: "hiker://page/action_bar_demo.v#noLoading#?rule=原生组件工坊",
        extra: { lineVisible: false }
    };
}
$.exports = {
    apiVersion: 1,
    longPressVersion: 1,
    imageDecoderVersion: 1,
    normalize: normalize,
    row: row,
    create: create,
    mount: mount,
    update: Host.update,
    release: Host.release,
    demoButton: demoButton
};
