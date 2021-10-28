var Bus = (function () {
  "use strict";
  var o = 0;
  function r(n) {
    var i = [],
      u = 0,
      s = 0;
    (this.push = function (r) {
      n <= u - s && n <= ++s && ((s = 0), (u = n - 1)), (i[u % n] = r), u++;
    }),
      (this.asArray = function () {
        var r = i.slice(s, Math.min(u, n)),
          t = i.slice(0, Math.max(u - n, 0));
        return r.concat(t);
      }),
      (this.list = i);
  }
  function a(r, t) {
    for (var n = t, i = 0; i < r.length; i++) {
      var u = r[i],
        s = n.r;
      s[u] || (s[u] = { w: u, r: {}, i: o++ }), (n = s[u]);
    }
    return n;
  }
  function p(r, t, n) {
    var i;
    return (
      n[r]
        ? (i = n[r])
        : ((i = (function (r, t) {
            for (var n = [[t, 0]], i = {}, u = []; n.length; ) {
              var s = n.shift(),
                e = s[0],
                o = s[1],
                a = e.r,
                f = r[o];
              if ((void 0 === f && e.fn && !i[e.i] ? ((i[e.i] = 1), u.push(e.fn)) : a[f] && n.push([a[f], o + 1]), a["#"])) for (var h = o; h <= r.length; h++) n.push([a["#"], h]);
              f && a["*"] && n.push([a["*"], o + 1]);
            }
            return u;
          })(r.split("."), t)),
          (n[r] = i)),
      i
    );
  }
  function t() {
    var h = { w: "", r: {}, i: o++ },
      c = {},
      v = new r(9999);
    (this.emit = function t(r, n) {
      var i = Date.now();
      v.push([r, i]);
      for (var u = p(r, h, c), s = [], e = { topic: r, ts: i }, o = 0; o < u.length; o++)
        for (var a = u[o], f = 0; f < a.length; f++)
          try {
            s.push(a[f](n, e));
          } catch (r) {
            if (!(0 < p("error", h, c).length)) throw r;
            t("error", r);
          }
      return s;
    }),
      (this.on = function (r, t) {
        var n = a(r.split("."), h),
          i = n.fn || [];
        return (
          i.push(t),
          (n.fn = i),
          (c = {}),
          function () {
            var r = i.indexOf(t);
            -1 < r && i.splice(r, 1);
          }
        );
      }),
      (this.history = function (r) {
        var t = { w: "", r: {}, i: o++ };
        a(r.split("."), t).fn = 1;
        for (var n = [], i = {}, u = v.asArray(), s = 0; s < u.length; s++) {
          var e = u[s];
          p(e[0], t, i).length && n.push(e);
        }
        return n;
      });
  }
  return (t.Ring = r), t;
})();
module.exports = Bus;
