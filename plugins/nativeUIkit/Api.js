// by:鬼佬的原生组件工坊
var components = {};
function component(name) {
    if (!components[name]) {
        components[name] = $.require(codePath + "plugins/nativeUIkit/" + name + ".js");
    }
    return components[name];
}

function actionBar(value, options) {
    var opts = prepare(options);
    return component("ActionBar").row(value, opts.scope, opts);
}
function movieDetailHeader(value, options) {
    var opts = prepare(options);
    return component("MovieDetailHeader").row(value, opts.scope, opts);
}
function richText(value, options) {
    var opts = prepare(options);
    return component("RichText").row(value, opts.scope, opts);
}
function markdown(value, options) {
    var opts = prepare(options);
    return component("Markdown").row(value, opts.scope, opts);
}
function markdownFile(source, options) {
    var opts = prepare(options);
    return component("Markdown").fileRow(source, opts.scope, opts);
}
function readMarkdown(source, options) {
    return component("Markdown").read(source, options);
}
function searchBox(options) {
    var opts = prepare(options);
    return component("NativeSearchBox").row(opts, opts.scope);
}
function iconMenu(values, options) {
    var opts = prepare(options);
    return component("IconMenu").row(values, opts.scope, opts);
}
function floatingCategories(values, options) {
    var opts = prepare(options);
    return component("FloatingCategories").row(values, opts.scope, opts);
}
function brandCategories(values, options) {
    var opts = prepare(options);
    return component("BrandCategories").row(values, opts.scope, opts);
}
function imageGallery(values, options) {
    var opts = prepare(options);
    return component("ImageGallery").row(values, opts.scope, opts);
}
function postCard(values, options) {
    var opts = prepare(options);
    return component("PostCard").row(values, opts.scope, opts);
}
function timeline(values, options) {
    var opts = prepare(options);
    return component("Timeline").row(values, opts.scope, opts);
}
function featureCards(values, options) {
    var opts = prepare(options);
    return component("FeatureCards").row(values, opts.scope, opts);
}
function imageSlider(values, options) {
    var opts = prepare(options);
    return component("ImageSlider").row(values, opts.scope, opts);
}
function topicHeader(value, options) {
    var opts = prepare(options);
    return component("TopicHeader").row(value, opts.scope, opts);
}
function userProfile(value, options) {
    var opts = prepare(options);
    return component("UserProfile").row(value, opts.scope, opts);
}
function topicGrid(values, options) {
    var value = prepare(options);
    return component("TopicGrid").row(values, value.scope, value);
}
function newsList(values, options) {
    var value = prepare(options);
    return component("NewsList").row(values, value.scope, value);
}
function waterfall(values, options) {
    var value = prepare(options);
    return component("WaterfallList").row(values, value.scope, value);
}

// 复制调用方 options 并补默认值，不修改调用方原对象。
function prepare(options) {
    var result = {},
        key;
    options = options || {};
    for (key in options) result[key] = options[key];
    result.scope = String(result.scope || "default");
    result.namespace = String(result.namespace || "外部调用");
    return result;
}

/** 轮播：返回占位行数组（空数据返回 []），可直接拼进 setResult 列表。 */
function carousel(cards, options) {
    var value = prepare(options);
    if (value.autoplay === undefined) value.autoplay = true;
    return component("Carousel").row(cards, value.scope, value);
}
/** 嵌套回复框：返回占位行数组，默认预览 5 条。 */
function replies(values, options) {
    var value = prepare(options);
    return component("ReplyBox").row(values, value.scope, value);
}
/** 评论列表：每条主评论一行，自动带灰色楼中楼，可与普通行混排。 */
function comments(values, options) {
    var value = prepare(options);
    return component("CommentList").row(values, value.scope, value);
}

/** 用户列表：白色圆角卡片，超过8人自动分块为可回收行，保留头像、昵称、数量、时间和关注按钮。 */
function users(values, options) {
    var value = prepare(options);
    return component("UserList").row(values, value.scope, value);
}
/** 下载列表：复用用户卡片布局与原生宿主，仅替换图标、计数和按钮样式。 */
function downloads(values, options) {
    var value = prepare(options);
    return component("DownloadList").row(values, value.scope, value);
}

// 展开嵌套数组，render 允许直接传入组件方法的返回值。
function flatten(items) {
    var result = [];
    function append(item) {
        if (Array.isArray(item)) item.forEach(append);
        else if (item) result.push(item);
    }
    append(items);
    return result;
}

/**
 * 挂载已 setResult 的组件行；参数可以是整页列表、组件行数组或单行。
 * 按行上的组件标记分发到对应组件，普通海阔行被跳过。返回 tickets 数组。
 */
function mount(rows) {
    return mountRows(flatten(rows));
}

// render 已展开列表，直接分发，避免再次创建整页副本。
function mountRows(rows) {
    var tickets = [];
    rows.forEach(function (row) {
        var extra = row.extra || {};
        var ticket = null;
        if (extra.nativeView && extra.nativeView.kind === "actionBar")
            ticket = component("ActionBar").mount(row, extra.nativeView.scope);
        else if (extra.nativeView && extra.nativeView.kind === "searchBox")
            ticket = component("NativeSearchBox").mount(row, extra.nativeView.scope);
        else if (extra.nativeCarousel)
            ticket = component("Carousel").mount(row, extra.nativeCarousel.scope);
        else if (extra.nativeIconMenu)
            ticket = component("IconMenu").mount(row, extra.nativeIconMenu.scope);
        else if (extra.nativeView && extra.nativeView.kind === "comment")
            ticket = component("CommentList").mount(row)[0];
        else if (extra.nativeView && extra.nativeView.kind === "users")
            ticket = component("UserList").mount(row)[0];
        else if (extra.nativeView && extra.nativeView.kind === "downloads")
            ticket = component("DownloadList").mount(row)[0];
        else if (extra.nativeView && extra.nativeView.kind === "waterfall")
            ticket = component("WaterfallList").mount(row);
        else if (extra.nativeView && extra.nativeView.kind === "topicGrid")
            ticket = component("TopicGrid").mount(row);
        else if (extra.nativeView && extra.nativeView.kind === "movieDetailHeader")
            ticket = component("MovieDetailHeader").mount(row);
        else if (extra.nativeView && extra.nativeView.kind === "markdown")
            ticket = component("Markdown").mount(row);
        else if (extra.nativeView && extra.nativeView.kind === "richText")
            ticket = component("RichText").mount(row);
        else if (extra.nativeView && extra.nativeView.kind === "newsList")
            ticket = component("NewsList").mount(row);
        else if (extra.nativeView && extra.nativeView.kind === "topicHeader")
            ticket = component("TopicHeader").mount(row);
        else if (extra.nativeView && extra.nativeView.kind === "userProfile")
            ticket = component("UserProfile").mount(row);
        else if (extra.nativeView && extra.nativeView.kind === "floatingCategories")
            ticket = component("FloatingCategories").mount(row);
        else if (extra.nativeView && extra.nativeView.kind === "brandCategories")
            ticket = component("BrandCategories").mount(row);
        else if (extra.nativeView && extra.nativeView.kind === "imageGallery")
            ticket = component("ImageGallery").mount(row);
        else if (extra.nativeView && extra.nativeView.kind === "timeline")
            ticket = component("Timeline").mount(row);
        else if (extra.nativeView && extra.nativeView.kind === "featureCards")
            ticket = component("FeatureCards").mount(row);
        else if (extra.nativeView && extra.nativeView.kind === "imageSlider")
            ticket = component("ImageSlider").mount(row);
        else if (extra.nativeView && extra.nativeView.kind === "postCard")
            ticket = component("PostCard").mount(row)[0];
        else if (extra.nativeView) ticket = component("ReplyBox").mount(row);
        if (ticket) tickets.push(ticket);
    });
    return tickets;
}

/** 一步渲染：展开列表 → setResult → 挂载组件。返回 tickets，可交给 release。 */
function render(items) {
    var rows = flatten(items);
    setResult(rows);
    return mountRows(rows);
}

/** 单次调用完成提交与挂载；after 可追加返回/文档等普通行。 */
function show(kind, values, options) {
    var widget =
        kind === "searchBox"
            ? function (_values, options) {
                return searchBox(options);
            }
            : kind === "brandCategories"
                ? brandCategories
                : kind === "iconMenu"
                    ? iconMenu
                    : kind === "floatingCategories"
                        ? floatingCategories
                        : kind === "imageGallery"
                            ? imageGallery
                            : kind === "postCard"
                                ? postCard
                                : kind === "imageSlider"
                                    ? imageSlider
                                    : kind === "topicHeader"
                                        ? topicHeader
                                        : kind === "userProfile"
                                            ? userProfile
                                            : kind === "topicGrid"
                                                ? topicGrid
                                                : kind === "newsList"
                                                    ? newsList
                                                    : kind === "waterfall"
                                                        ? waterfall
                                                        : kind === "carousel"
                                                            ? carousel
                                                            : kind === "replies"
                                                                ? replies
                                                                : kind === "comments"
                                                                    ? comments
                                                                    : kind === "users"
                                                                        ? users
                                                                        : kind === "downloads"
                                                                            ? downloads
                                                                            : null;
    if (kind === "actionBar") widget = actionBar;
    if (kind === "movieDetailHeader") widget = movieDetailHeader;
    if (kind === "richText") widget = richText;
    if (kind === "markdown") widget = markdown;
    if (kind === "markdownFile") widget = markdownFile;
    if (kind === "timeline") widget = timeline;
    if (kind === "featureCards") widget = featureCards;
    if (!widget) return [];
    return render([widget(values, options), options && options.after]);
}

/** 释放挂载：参数为 mount/render/show 返回的 tickets 数组或单个 ticket。 */
function release(tickets) {
    (Array.isArray(tickets) ? tickets : [tickets]).forEach(function (ticket) {
        if (ticket) component("NativeCarousel").release(ticket);
    });
}

/** 演示入口按钮：kind 为 "carousel" | "replies" | "users" | "downloads" | "comments"（默认）。 */
function demoButton(kind, label) {
    if (kind === "actionBar") return component("ActionBar").demoButton(label);
    if (kind === "movieDetailHeader") return component("MovieDetailHeader").demoButton(label);
    if (kind === "richText") return component("RichText").demoButton(label);
    if (kind === "markdown" || kind === "markdownFile")
        return component("Markdown").demoButton(label);
    if (kind === "searchBox") return component("NativeSearchBox").demoButton(label);
    if (kind === "captchaDialog") return component("CaptchaDialog").demoButton(label);
    if (kind === "brandCategories") return component("BrandCategories").demoButton(label);
    if (kind === "iconMenu") return component("IconMenu").demoButton(label);
    if (kind === "floatingCategories") return component("FloatingCategories").demoButton(label);
    if (kind === "imageGallery") return component("ImageGallery").demoButton(label);
    if (kind === "postCard") return component("PostCard").demoButton(label);
    if (kind === "timeline") return component("Timeline").demoButton(label);
    if (kind === "featureCards") return component("FeatureCards").demoButton(label);
    if (kind === "imageSlider") return component("ImageSlider").demoButton(label);
    if (kind === "topicHeader") return component("TopicHeader").demoButton(label);
    if (kind === "userProfile") return component("UserProfile").demoButton(label);
    if (kind === "topicGrid") return component("TopicGrid").demoButton(label);
    if (kind === "newsList") return component("NewsList").demoButton(label);
    if (kind === "waterfall") return component("WaterfallList").demoButton(label);
    if (kind === "carousel") return component("Carousel").demoButton(label);
    if (kind === "replies") return component("ReplyBox").demoButton(label);
    if (kind === "users") return component("UserList").demoButton(label);
    if (kind === "downloads") return component("DownloadList").demoButton(label);
    return component("CommentList").demoButton(label);
}

/** Native modal; does not call setResult or mount list rows. */
function captchaDialog(options) {
    return component("CaptchaDialog").show(prepare(options));
}
function closeCaptchaDialog(scope, namespace) {
    return component("CaptchaDialog").close(scope, namespace);
}
function imageViewer(values, selected, headers, imageDecoder) {
    return component("ImageViewer").action(values, selected, headers, imageDecoder);
}
$.exports = {
    imageDecoderVersion: 1,
    actionBar: actionBar,
    movieDetailHeader: movieDetailHeader,
    richText: richText,
    markdown: markdown,
    markdownFile: markdownFile,
    readMarkdown: readMarkdown,
    searchBox: searchBox,
    captchaDialog: captchaDialog,
    closeCaptchaDialog: closeCaptchaDialog,
    imageViewer: imageViewer,
    apiVersion: 1,
    iconMenu: iconMenu,
    brandCategories: brandCategories,
    floatingCategories: floatingCategories,
    imageGallery: imageGallery,
    postCard: postCard,
    imageSlider: imageSlider,
    featureCards: featureCards,
    timeline: timeline,
    topicHeader: topicHeader,
    userProfile: userProfile,
    topicGrid: topicGrid,
    newsList: newsList,
    waterfall: waterfall,
    show: show,
    render: render,
    carousel: carousel,
    replies: replies,
    comments: comments,
    users: users,
    downloads: downloads,
    mount: mount,
    release: release,
    demoButton: demoButton
};
