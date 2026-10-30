
  var ns = "native.workshop.v1.";
  var title = "原生组件工坊";
  function read(key, fallback) {
    return String(getMyVar(ns + key, fallback === undefined ? "" : String(fallback)));
  }
  function write(key, value) {
    putMyVar(ns + key, String(value));
  }
  function safe(value) {
    return encodeURIComponent(String(value)).replace(/%/g, "_");
  }
  function route(page, values) {
    var url = "hiker://page/" + page + "#noLoading#?rule=" + title;
    Object.keys(values || {}).forEach(function (key) {
      if (key !== "rule") url += "&" + key + "=" + encodeURIComponent(String(values[key]));
    });
    return url;
  }
  function layout() {
    var value = read("layout", "banner");
    return ["banner", "landscape", "portrait"].indexOf(value) >= 0 ? value : "banner";
  }
  function dataset() {
    var value = read("dataset", "all");
    return ["all", "single", "empty"].indexOf(value) >= 0 ? value : "all";
  }
  function style() {
    var value = read("style", "");
    if (["banner", "cards", "overlay"].indexOf(value) >= 0) return value;
    return layout() === "banner" ? "banner" : "cards";
  }
  $.exports = {
    ns: ns,
    title: title,
    read: read,
    write: write,
    safe: safe,
    route: route,
    layout: layout,
    style: style,
    dataset: dataset
  };