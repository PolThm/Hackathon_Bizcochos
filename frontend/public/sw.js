if (!self.define) {
  let e,
    a = {};
  const i = (i, c) => (
    (i = new URL(i + '.js', c).href),
    a[i] ||
      new Promise((a) => {
        if ('document' in self) {
          const e = document.createElement('script');
          ((e.src = i), (e.onload = a), document.head.appendChild(e));
        } else ((e = i), importScripts(i), a());
      }).then(() => {
        let e = a[i];
        if (!e) throw new Error(`Module ${i} didn’t register its module`);
        return e;
      })
  );
  self.define = (c, s) => {
    const d =
      e ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href;
    if (a[d]) return;
    let f = {};
    const b = (e) => i(e, d),
      r = { module: { uri: d }, exports: f, require: b };
    a[d] = Promise.all(c.map((e) => r[e] || b(e))).then((e) => (s(...e), f));
  };
}
define(['./workbox-f1770938'], function (e) {
  'use strict';
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: '/_next/static/QzwGMQuC9TkzsiozCeq39/_buildManifest.js',
          revision: '7de1f6a3643723163683fb3190519e7e',
        },
        {
          url: '/_next/static/QzwGMQuC9TkzsiozCeq39/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        {
          url: '/_next/static/chunks/104-c5f30dd157168c6d.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/194-87a74bd708ec8591.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/211-8e9247ab26fb414a.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/281-833114ec24b1acf0.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/459-2c6c652bbd6c94c7.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/547-b51f59f31d9d8519.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/548-d9101a37d97c4750.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/560-0ade552bb7c1dca7.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/570-180369f4d41941d2.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/589-900c76a3d4a22b58.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/605-3942fd5aa69a7ca6.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/618f8807-fcf7d348a04e7ae5.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/721-f6729e67f3e47fdf.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/759-49c0af17f956a3ab.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/762-79187b4d7469080a.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/782-40e6df1b87f2ca2b.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/80-2b54999354653798.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/908-cee348d8bca07e32.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/915-5c634e04f4020eb7.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/app/%5Blocale%5D/error-da8a78b74382351b.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/app/%5Blocale%5D/exercise/%5Bid%5D/page-d31a2f91f9aa5182.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/app/%5Blocale%5D/layout-15d688b1bd439f34.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/app/%5Blocale%5D/library/page-e2122b800f66ab2d.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/app/%5Blocale%5D/loading-0c4c27a865fe116c.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/app/%5Blocale%5D/new-routine/page-f1cd1868c98bc7ac.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/app/%5Blocale%5D/not-found-90c709ce4dce7b54.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/app/%5Blocale%5D/page-c5f7a546df7d4d82.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/app/%5Blocale%5D/parameters/page-9729d53c08c492b9.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/app/%5Blocale%5D/practice/page-d5fa1ab959ab6fff.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/app/%5Blocale%5D/setup/page-384bef3892d1ebbc.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-74c9fb2664babf34.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/d1079e37-af34d818add97452.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/framework-4a756692a4ba1ea2.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/main-5f36c192e1c9ec84.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/main-app-2d12065347b8a255.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/pages/_app-60a9b6d9732ea080.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/pages/_error-0f4f694067cdb47d.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/chunks/polyfills-78c92fac7aa8fdd8.js',
          revision: '79330112775102f91e1010318bae2bd3',
        },
        {
          url: '/_next/static/chunks/webpack-6d43c25f44234f82.js',
          revision: 'QzwGMQuC9TkzsiozCeq39',
        },
        {
          url: '/_next/static/css/1f570c22efea1762.css',
          revision: '1f570c22efea1762',
        },
        {
          url: '/_next/static/media/07c7524c3dbf315d-s.p.woff2',
          revision: 'da4677bf5da1a72f2bae481d36da8203',
        },
        {
          url: '/_next/static/media/1f37188f79e0c26c-s.woff2',
          revision: '57e32f62dc0888bd035c09d27a89c550',
        },
        {
          url: '/_next/static/media/23c2ed8965ac96b5-s.woff2',
          revision: '846484ff5a22b6a74ac946b5013702b1',
        },
        {
          url: '/_next/static/media/24c15609eaa28576-s.woff2',
          revision: 'be8ee93a8cf390eb9cb6e6aadf1a3bf0',
        },
        {
          url: '/_next/static/media/2c07349e02a7b712-s.woff2',
          revision: '399fb80a20ea7d2a53a1d6dc1e5f392a',
        },
        {
          url: '/_next/static/media/456105d6ea6d39e0-s.woff2',
          revision: '7dd9a80944f5a408172dff15b0020357',
        },
        {
          url: '/_next/static/media/47cbc4e2adbc5db9-s.p.woff2',
          revision: '4746809ed1c17447d45d2a96c64796d4',
        },
        {
          url: '/_next/static/media/4f77bef990aad698-s.woff2',
          revision: '7072622b195592e866ed97cb26005e27',
        },
        {
          url: '/_next/static/media/627d916fd739a539-s.woff2',
          revision: 'c46f88e9518178fd56311db461452f8d',
        },
        {
          url: '/_next/static/media/63b255f18bea0ca9-s.woff2',
          revision: 'd7595e609e29ce4f4f1984f0b2b29015',
        },
        {
          url: '/_next/static/media/70bd82ac89b4fa42-s.woff2',
          revision: 'a243fd759c7ef48545d096f23dccf1df',
        },
        {
          url: '/_next/static/media/84602850c8fd81c3-s.woff2',
          revision: 'bdf2a9a2d904dc21d9b593b82887af52',
        },
        {
          url: '/_next/static/media/c9236baabfe65f41-s.woff2',
          revision: 'edfdb1bed7c6e04ab1532c576d9a8683',
        },
        {
          url: '/_next/static/media/cfeb946bc49b6ba8-s.woff2',
          revision: 'e2fa63f27900b8de26a26c0897890060',
        },
        { url: '/favicon.ico', revision: '574f5a6c9622ec74a3a9092fb64af919' },
        { url: '/icons-192.png', revision: '0dae11b4bfa676baf6b50c9777515ede' },
        { url: '/icons-256.png', revision: 'b269e7186a96f29d5f58e316a03bb548' },
        { url: '/icons-512.png', revision: '04aee2fa3a51f0306355d9d17c9ddc62' },
        {
          url: '/images/exercises/image_00000-89de3e43a7252c332f0d0df0efe89bd3.png',
          revision: '89de3e43a7252c332f0d0df0efe89bd3',
        },
        {
          url: '/images/exercises/image_00001-c64f64fccf5a063895af2e58fb82ae3e.png',
          revision: 'c64f64fccf5a063895af2e58fb82ae3e',
        },
        {
          url: '/images/exercises/image_00002-60c3a51dfc4ad9568c68ce0e904d59f3.png',
          revision: '60c3a51dfc4ad9568c68ce0e904d59f3',
        },
        {
          url: '/images/exercises/image_00003-301c70a503de8d49452a3acbfce79c01.png',
          revision: '301c70a503de8d49452a3acbfce79c01',
        },
        {
          url: '/images/exercises/image_00004-737b5dd92a3b5b0375d466abd191db35.png',
          revision: '737b5dd92a3b5b0375d466abd191db35',
        },
        {
          url: '/images/exercises/image_00005-3fa57823222213be590cd6f92342f8b9.png',
          revision: '3fa57823222213be590cd6f92342f8b9',
        },
        {
          url: '/images/exercises/image_00006-f3b02ce7c0ad85f7818ea346e8d29c67.png',
          revision: 'f3b02ce7c0ad85f7818ea346e8d29c67',
        },
        {
          url: '/images/exercises/image_00007-656ddc506f3c44b547a65f782e838e86.png',
          revision: '656ddc506f3c44b547a65f782e838e86',
        },
        {
          url: '/images/exercises/image_00008a-772432c62e4c6a3cb48acb7e7956eb4c.png',
          revision: '772432c62e4c6a3cb48acb7e7956eb4c',
        },
        {
          url: '/images/exercises/image_00009a-5d69db68997b725c97cb56595e96c1b0.png',
          revision: '5d69db68997b725c97cb56595e96c1b0',
        },
        {
          url: '/images/exercises/image_00010-7aa678591e0751eea948eca8c6085f75.png',
          revision: '7aa678591e0751eea948eca8c6085f75',
        },
        {
          url: '/images/exercises/image_00011-4065b72be07921523193799bcc2941bb.png',
          revision: '4065b72be07921523193799bcc2941bb',
        },
        {
          url: '/images/exercises/image_00012-91ab7ebe50ff0cdb0ffc83969496af50.png',
          revision: '91ab7ebe50ff0cdb0ffc83969496af50',
        },
        {
          url: '/images/exercises/image_00013-2162dd2031c60b45123392bd307189b5.png',
          revision: '2162dd2031c60b45123392bd307189b5',
        },
        {
          url: '/images/exercises/image_00014-a1c5d8f2b298b4517ff22511b2826269.png',
          revision: 'a1c5d8f2b298b4517ff22511b2826269',
        },
        {
          url: '/images/exercises/image_00015-27422cdda838adeb1392e2d56079de3a.png',
          revision: '27422cdda838adeb1392e2d56079de3a',
        },
        {
          url: '/images/exercises/image_00016-6524520bf715f734f439d732496b097c.png',
          revision: '6524520bf715f734f439d732496b097c',
        },
        {
          url: '/images/exercises/image_00017-f905ab643987fc61003edf4df2e11d3d.png',
          revision: 'f905ab643987fc61003edf4df2e11d3d',
        },
        {
          url: '/images/exercises/image_00018-b517896280fb76029c44067a880ef2ad.png',
          revision: 'b517896280fb76029c44067a880ef2ad',
        },
        {
          url: '/images/exercises/image_00019-dd281b9bd56c8766e29fd9a8035bc02a.png',
          revision: 'dd281b9bd56c8766e29fd9a8035bc02a',
        },
        {
          url: '/images/exercises/image_00020-1ffae8024ac92bd46baec1c03157caf4.png',
          revision: '1ffae8024ac92bd46baec1c03157caf4',
        },
        {
          url: '/images/exercises/image_00021-6e755ab11944383a4a8918d2e8a24822.png',
          revision: '6e755ab11944383a4a8918d2e8a24822',
        },
        {
          url: '/images/exercises/image_00022-118f29a3f6045d74d74d7407a85cf8e8.png',
          revision: '118f29a3f6045d74d74d7407a85cf8e8',
        },
        {
          url: '/images/exercises/image_00023-8ac751e135290072d672e9774d48d722.png',
          revision: '8ac751e135290072d672e9774d48d722',
        },
        {
          url: '/images/exercises/image_00024-75bc0a33a0b7716bec561503be0cf473.png',
          revision: '75bc0a33a0b7716bec561503be0cf473',
        },
        {
          url: '/images/exercises/image_00025-e025b695536978822c6644cfa0c439dd.png',
          revision: 'e025b695536978822c6644cfa0c439dd',
        },
        {
          url: '/images/exercises/image_00026-e28397c45d2e360a9678a7fb34e6b179.png',
          revision: 'e28397c45d2e360a9678a7fb34e6b179',
        },
        {
          url: '/images/exercises/image_00027a-2cb95174f6457d62914d64e60a0f99d4.png',
          revision: '2cb95174f6457d62914d64e60a0f99d4',
        },
        {
          url: '/images/exercises/image_00028-c3bd8036c30d4f67a5a5ce12f2b2e308.png',
          revision: 'c3bd8036c30d4f67a5a5ce12f2b2e308',
        },
        {
          url: '/images/exercises/image_00029-d5332e24d2c841901efbed4200ab17ec.png',
          revision: 'd5332e24d2c841901efbed4200ab17ec',
        },
        {
          url: '/images/exercises/image_00030-e32f7ec24e9afd52eea65edbdcd388b0.png',
          revision: 'e32f7ec24e9afd52eea65edbdcd388b0',
        },
        {
          url: '/images/exercises/image_00031-3255e405d87bc2a742fd2174cc015090.png',
          revision: '3255e405d87bc2a742fd2174cc015090',
        },
        {
          url: '/images/exercises/image_00032-0c66a9eee7a38f619f50067290b4eb82.png',
          revision: '0c66a9eee7a38f619f50067290b4eb82',
        },
        {
          url: '/images/exercises/image_00033-837aaf23d6f0382d2dd6ec6277e2c063.png',
          revision: '837aaf23d6f0382d2dd6ec6277e2c063',
        },
        {
          url: '/images/exercises/image_00034-fbb468e32c51d0c9bb02e2e311aecad0.png',
          revision: 'fbb468e32c51d0c9bb02e2e311aecad0',
        },
        {
          url: '/images/exercises/image_00036-24322f5ef4c83686782745b959a6d5df.png',
          revision: '24322f5ef4c83686782745b959a6d5df',
        },
        {
          url: '/images/exercises/image_00038-990851a373536c46f0a5810798a94223.png',
          revision: '990851a373536c46f0a5810798a94223',
        },
        {
          url: '/images/exercises/image_00040-c19c58a7a338542649f881d9c8ef7849.png',
          revision: 'c19c58a7a338542649f881d9c8ef7849',
        },
        {
          url: '/images/exercises/image_00041-07d93aa295f83df533ebcfb7fe486e52.png',
          revision: '07d93aa295f83df533ebcfb7fe486e52',
        },
        {
          url: '/images/exercises/image_00042-5bb7eb8c7f348234048bbdbd5e29297c.png',
          revision: '5bb7eb8c7f348234048bbdbd5e29297c',
        },
        {
          url: '/images/exercises/image_00043b-270fb09bf94c39e9c226a32862000068.png',
          revision: '270fb09bf94c39e9c226a32862000068',
        },
        {
          url: '/images/exercises/image_00044b-c52d5cf97244aeab1a709dd039314efe.png',
          revision: 'c52d5cf97244aeab1a709dd039314efe',
        },
        {
          url: '/images/exercises/image_00045a-2f75c4d8cdd6ee8a95712682b95086a7.png',
          revision: '2f75c4d8cdd6ee8a95712682b95086a7',
        },
        {
          url: '/images/exercises/image_00046a-80efdaf530016dcb1b8035e27d7c212d.png',
          revision: '80efdaf530016dcb1b8035e27d7c212d',
        },
        {
          url: '/images/exercises/image_00047a-0cd84a967ef5cd1b4111bca12e79f87a.png',
          revision: '0cd84a967ef5cd1b4111bca12e79f87a',
        },
        {
          url: '/images/exercises/image_00048a-2bf340250348d2b02366f2041d727e50.png',
          revision: '2bf340250348d2b02366f2041d727e50',
        },
        {
          url: '/images/exercises/image_00049-bdf345dd1bac163672e6993615cc7d80.png',
          revision: 'bdf345dd1bac163672e6993615cc7d80',
        },
        {
          url: '/images/exercises/image_00050-356fb944e7492a8828f93ffd32d7adc1.png',
          revision: '356fb944e7492a8828f93ffd32d7adc1',
        },
        {
          url: '/images/exercises/image_00051-d792f8a0aac5a903215e93a01755f5df.png',
          revision: 'd792f8a0aac5a903215e93a01755f5df',
        },
        {
          url: '/images/exercises/image_00052-4c2269eb1440e640936e511776312fb5.png',
          revision: '4c2269eb1440e640936e511776312fb5',
        },
        {
          url: '/images/exercises/image_00053-02591bd1edcc65d6988c8e8f63ac5cc0.png',
          revision: '02591bd1edcc65d6988c8e8f63ac5cc0',
        },
        {
          url: '/images/exercises/image_00054-526851d0878f402644e7aa2c04897699.png',
          revision: '526851d0878f402644e7aa2c04897699',
        },
        {
          url: '/images/exercises/image_00055-ad00d872116929a13689794d4e5c1fd1.png',
          revision: 'ad00d872116929a13689794d4e5c1fd1',
        },
        {
          url: '/images/exercises/image_00056-ef377ae2cf4fd2b2bd5d4d55fa6e28fa.png',
          revision: 'ef377ae2cf4fd2b2bd5d4d55fa6e28fa',
        },
        {
          url: '/images/exercises/image_00057-141722fa8344a8c99f6721016153b3ec.png',
          revision: '141722fa8344a8c99f6721016153b3ec',
        },
        {
          url: '/images/exercises/image_00058a-42be06860bd92b1cdbb6f395505aaf4a.png',
          revision: '42be06860bd92b1cdbb6f395505aaf4a',
        },
        {
          url: '/images/exercises/image_00059a-80783938e2ae8b9eb36ec0d8a7d6f97c.png',
          revision: '80783938e2ae8b9eb36ec0d8a7d6f97c',
        },
        {
          url: '/images/exercises/image_00060a-4df6cdac2b4a6f66ab1183d284ea20fb.png',
          revision: '4df6cdac2b4a6f66ab1183d284ea20fb',
        },
        {
          url: '/images/exercises/image_00061a-0a813b49aa2e4b59f058c36162cd7873.png',
          revision: '0a813b49aa2e4b59f058c36162cd7873',
        },
        {
          url: '/images/exercises/image_00062-3f8e2bbdc586cd1eb4740c8fcdaa848e.png',
          revision: '3f8e2bbdc586cd1eb4740c8fcdaa848e',
        },
        {
          url: '/images/exercises/image_00063-6deb3f75808a481a16888b0d9db4bfed.png',
          revision: '6deb3f75808a481a16888b0d9db4bfed',
        },
        {
          url: '/images/exercises/image_00064-d903c783d8f0860ba4b26a1a6afc78eb.png',
          revision: 'd903c783d8f0860ba4b26a1a6afc78eb',
        },
        {
          url: '/images/exercises/image_00065-7be6c47bf374018908a578df567e3432.png',
          revision: '7be6c47bf374018908a578df567e3432',
        },
        {
          url: '/images/exercises/image_00066-fa28909c06ea7d622f1b078c799b536f.png',
          revision: 'fa28909c06ea7d622f1b078c799b536f',
        },
        {
          url: '/images/exercises/image_00067-82ab96caa45feaa6991b0a8bd2aac71b.png',
          revision: '82ab96caa45feaa6991b0a8bd2aac71b',
        },
        {
          url: '/images/exercises/image_00068-42a4e459d0d8ba5903b9d5cade6b15e4.png',
          revision: '42a4e459d0d8ba5903b9d5cade6b15e4',
        },
        {
          url: '/images/exercises/image_00069-33af808b4c3605e28b98c60a7e5ad769.png',
          revision: '33af808b4c3605e28b98c60a7e5ad769',
        },
        {
          url: '/images/exercises/image_00070-c967c5dc622a222067ee9b0091ba1b57.png',
          revision: 'c967c5dc622a222067ee9b0091ba1b57',
        },
        {
          url: '/images/exercises/image_00071-c9f7d083634be1ccd88d779f78d69673.png',
          revision: 'c9f7d083634be1ccd88d779f78d69673',
        },
        {
          url: '/images/exercises/image_00072-22e41429622501e69ff280d86f4a1f57.png',
          revision: '22e41429622501e69ff280d86f4a1f57',
        },
        {
          url: '/images/exercises/image_00073-77a21d3acaf1cc5d719ebe4a35e7cae7.png',
          revision: '77a21d3acaf1cc5d719ebe4a35e7cae7',
        },
        {
          url: '/images/exercises/image_00074-083408f8fd9da06a7a0ca117566922b2.png',
          revision: '083408f8fd9da06a7a0ca117566922b2',
        },
        {
          url: '/images/exercises/image_00075-063432153d85e81fab990403d0a0449d.png',
          revision: '063432153d85e81fab990403d0a0449d',
        },
        {
          url: '/images/exercises/image_00076-9972f56044cd60fbe7fc1ab3077752cf.png',
          revision: '9972f56044cd60fbe7fc1ab3077752cf',
        },
        {
          url: '/images/exercises/image_00077-9104c68e13fb5bc8f66bd5ad55a6be1d.png',
          revision: '9104c68e13fb5bc8f66bd5ad55a6be1d',
        },
        {
          url: '/images/exercises/image_00078-5c189a8d04c3aa1a4eff279242d864e0.png',
          revision: '5c189a8d04c3aa1a4eff279242d864e0',
        },
        {
          url: '/images/exercises/image_00079-399e01035c48e7efaf54260157d5304f.png',
          revision: '399e01035c48e7efaf54260157d5304f',
        },
        {
          url: '/images/exercises/image_00080-874b05741e71c12f57ea24e13d3d8408.png',
          revision: '874b05741e71c12f57ea24e13d3d8408',
        },
        {
          url: '/images/exercises/image_00081-a64b2b6583eee8c8d90d22f4f99d322b.png',
          revision: 'a64b2b6583eee8c8d90d22f4f99d322b',
        },
        {
          url: '/images/exercises/image_00082-68bcb4cb8c51aa01743ee0f77c3a4626.png',
          revision: '68bcb4cb8c51aa01743ee0f77c3a4626',
        },
        {
          url: '/images/exercises/image_00083-801c607218d9623bed8fa5eba906967d.png',
          revision: '801c607218d9623bed8fa5eba906967d',
        },
        {
          url: '/images/exercises/image_00084-8e805d7a0ec3fa7a2df7de6e3c120e31.png',
          revision: '8e805d7a0ec3fa7a2df7de6e3c120e31',
        },
        {
          url: '/images/exercises/image_00085-87236853c6bb950c859fb5f1c392e965.png',
          revision: '87236853c6bb950c859fb5f1c392e965',
        },
        {
          url: '/images/exercises/image_00086-6dcb45f99464d995d5b4af0c1b718347.png',
          revision: '6dcb45f99464d995d5b4af0c1b718347',
        },
        {
          url: '/images/exercises/image_00087-e702ee81d8cd3e52b5c10d88fc4ccd74.png',
          revision: 'e702ee81d8cd3e52b5c10d88fc4ccd74',
        },
        {
          url: '/images/exercises/image_00088-d7f0944630a6a585a67172d2d0835040.png',
          revision: 'd7f0944630a6a585a67172d2d0835040',
        },
        {
          url: '/images/exercises/image_00089-fb8a484bae5996b6ba50d4820ad7219b.png',
          revision: 'fb8a484bae5996b6ba50d4820ad7219b',
        },
        {
          url: '/images/exercises/image_00090-903b3c76c32a400696aba1e5c8578a7f.png',
          revision: '903b3c76c32a400696aba1e5c8578a7f',
        },
        {
          url: '/images/exercises/image_00091-73f6770d1739c4b43cd920c3d0378a33.png',
          revision: '73f6770d1739c4b43cd920c3d0378a33',
        },
        {
          url: '/images/exercises/image_00092-825310dce59695ac31c30992de1800d9.png',
          revision: '825310dce59695ac31c30992de1800d9',
        },
        {
          url: '/images/exercises/image_00093-f2009e592599c98c07c3be60702f6408.png',
          revision: 'f2009e592599c98c07c3be60702f6408',
        },
        {
          url: '/images/exercises/image_00094-506a407b2c077035aaa3e1ad0ff18df1.png',
          revision: '506a407b2c077035aaa3e1ad0ff18df1',
        },
        {
          url: '/images/exercises/image_00095-9caf55ea82241c9e37fd46e6e393242c.png',
          revision: '9caf55ea82241c9e37fd46e6e393242c',
        },
        {
          url: '/images/exercises/image_00096-444db3ca39e401a3857f0344d6e4f46c.png',
          revision: '444db3ca39e401a3857f0344d6e4f46c',
        },
        {
          url: '/images/exercises/image_00097-f7584b2cc9ac1bd9d36ddc8fba5a7eab.png',
          revision: 'f7584b2cc9ac1bd9d36ddc8fba5a7eab',
        },
        {
          url: '/images/exercises/image_00098-98a65055086f8cae9d2bf40ccfd07b53.png',
          revision: '98a65055086f8cae9d2bf40ccfd07b53',
        },
        {
          url: '/images/exercises/image_00099-8c7ec048b84c19d1f0fb845234b82b9a.png',
          revision: '8c7ec048b84c19d1f0fb845234b82b9a',
        },
        {
          url: '/images/exercises/image_00100-e61fa61869cff3cb20adbab7bd3403c5.png',
          revision: 'e61fa61869cff3cb20adbab7bd3403c5',
        },
        {
          url: '/images/exercises/image_00101-35677ae98990e5d27f1f77663334f9e3.png',
          revision: '35677ae98990e5d27f1f77663334f9e3',
        },
        {
          url: '/images/exercises/image_00102-e948f6b9327cd9f6774ac4541d5e029e.png',
          revision: 'e948f6b9327cd9f6774ac4541d5e029e',
        },
        {
          url: '/images/exercises/image_00103-3aa55f8472a0d29e41f6b9bf725e482c.png',
          revision: '3aa55f8472a0d29e41f6b9bf725e482c',
        },
        {
          url: '/images/exercises/image_00104-9356ebe4913168e6b2b60e74d6abd5d4.png',
          revision: '9356ebe4913168e6b2b60e74d6abd5d4',
        },
        {
          url: '/images/exercises/image_00105-3a07122c9ef7834a6bbf3ead7498b436.png',
          revision: '3a07122c9ef7834a6bbf3ead7498b436',
        },
        {
          url: '/images/exercises/image_00106-80e592e3703313388c1dcc1f31d201ac.png',
          revision: '80e592e3703313388c1dcc1f31d201ac',
        },
        {
          url: '/images/exercises/image_00107-8f6377f0d1abb6a2def3dada0fcf5071.png',
          revision: '8f6377f0d1abb6a2def3dada0fcf5071',
        },
        {
          url: '/images/exercises/image_00108-b4dbba48cb69ad122b5c503d72a9c65b.png',
          revision: 'b4dbba48cb69ad122b5c503d72a9c65b',
        },
        {
          url: '/images/exercises/image_00109-fd069dc81cac9a897a78fbc3d3591c24.png',
          revision: 'fd069dc81cac9a897a78fbc3d3591c24',
        },
        {
          url: '/images/exercises/image_00110-db60182511f1e2d5a819b0bbedaec868.png',
          revision: 'db60182511f1e2d5a819b0bbedaec868',
        },
        {
          url: '/images/exercises/image_00114-e9b27e59293adc143650562208f83cc8.png',
          revision: 'e9b27e59293adc143650562208f83cc8',
        },
        {
          url: '/images/exercises/image_00115-8149b215386ef7613914f020abd4b402.png',
          revision: '8149b215386ef7613914f020abd4b402',
        },
        {
          url: '/images/exercises/image_00116-3b47036604f67ffd1ca7e520cccb20f2.png',
          revision: '3b47036604f67ffd1ca7e520cccb20f2',
        },
        {
          url: '/images/exercises/image_00117-a36c380f4acb3d4187fc941a04f0d24c.png',
          revision: 'a36c380f4acb3d4187fc941a04f0d24c',
        },
        {
          url: '/images/exercises/image_00118-2144ed633e9702f3d0a19c49c4bc503c.png',
          revision: '2144ed633e9702f3d0a19c49c4bc503c',
        },
        {
          url: '/images/exercises/image_00119-06ca970f3d555636872aeaacc909b859.png',
          revision: '06ca970f3d555636872aeaacc909b859',
        },
        {
          url: '/images/exercises/image_00120-ecc50c076dea3c04e47d68066fd0063c.png',
          revision: 'ecc50c076dea3c04e47d68066fd0063c',
        },
        {
          url: '/images/exercises/image_00121-681aa79ae7f772b15062af4598d1da1f.png',
          revision: '681aa79ae7f772b15062af4598d1da1f',
        },
        {
          url: '/images/exercises/image_00122-bcf7b38f5cd46a2364ec27b216636eaa.png',
          revision: 'bcf7b38f5cd46a2364ec27b216636eaa',
        },
        {
          url: '/images/exercises/image_00123-df940bc306d437855e91a9658bf8c715.png',
          revision: 'df940bc306d437855e91a9658bf8c715',
        },
        {
          url: '/images/exercises/image_00124-ce183ae483b1312a67afad4193a60f9c.png',
          revision: 'ce183ae483b1312a67afad4193a60f9c',
        },
        {
          url: '/images/exercises/image_00125-e5d9b3b56009608a3f5a8532d7f425aa.png',
          revision: 'e5d9b3b56009608a3f5a8532d7f425aa',
        },
        {
          url: '/images/exercises/image_00126-031ae748245d9436f7f6ee651bf03230.png',
          revision: '031ae748245d9436f7f6ee651bf03230',
        },
        {
          url: '/images/exercises/image_00127-8a1bf35be484e3a8e62f04eb78a3e859.png',
          revision: '8a1bf35be484e3a8e62f04eb78a3e859',
        },
        {
          url: '/images/exercises/image_00128-8b9c169565109549f9c52951046fa2c9.png',
          revision: '8b9c169565109549f9c52951046fa2c9',
        },
        {
          url: '/images/exercises/image_00129-09cec47bf2a53734c5ff5a6c88258938.png',
          revision: '09cec47bf2a53734c5ff5a6c88258938',
        },
        {
          url: '/images/exercises/image_00130-128d1f9daaa6f4f56916414cb8e50941.png',
          revision: '128d1f9daaa6f4f56916414cb8e50941',
        },
        {
          url: '/images/exercises/image_00131-768b4cd5cbdf2cd2824ac99ed0d515a0.png',
          revision: '768b4cd5cbdf2cd2824ac99ed0d515a0',
        },
        {
          url: '/images/exercises/image_00132-b76725df4d5b527c21080fe7e882505e.png',
          revision: 'b76725df4d5b527c21080fe7e882505e',
        },
        {
          url: '/images/exercises/image_00133-f7e34b03fcaf47b3cd86f4195a94ad85.png',
          revision: 'f7e34b03fcaf47b3cd86f4195a94ad85',
        },
        {
          url: '/images/exercises/image_00134-a72f2f9c3645edf51c6f067c14014211.png',
          revision: 'a72f2f9c3645edf51c6f067c14014211',
        },
        {
          url: '/images/exercises/image_00135-700a6e79da77681d242cf82a915ad33c.png',
          revision: '700a6e79da77681d242cf82a915ad33c',
        },
        {
          url: '/images/exercises/image_00136-35d48fee27be19e5746c71fb6f00d2d7.png',
          revision: '35d48fee27be19e5746c71fb6f00d2d7',
        },
        {
          url: '/images/exercises/image_00137-02fda21d7728b3892e7e2d65b4a334c3.png',
          revision: '02fda21d7728b3892e7e2d65b4a334c3',
        },
        {
          url: '/images/exercises/image_00138-75295414029e4b3dc0a1919db326709a.png',
          revision: '75295414029e4b3dc0a1919db326709a',
        },
        {
          url: '/images/exercises/image_00139-a167beaeffddb0dcf40b32d4117677cc.png',
          revision: 'a167beaeffddb0dcf40b32d4117677cc',
        },
        {
          url: '/images/exercises/image_00140-b3b7968582d5037f9d96f8ba55366061.png',
          revision: 'b3b7968582d5037f9d96f8ba55366061',
        },
        {
          url: '/images/exercises/image_00141-ccd843a1e7cbdf064e8e0887501bcaa1.png',
          revision: 'ccd843a1e7cbdf064e8e0887501bcaa1',
        },
        {
          url: '/images/exercises/image_00142-324c322424110da6b6a162e7e209a3d5.png',
          revision: '324c322424110da6b6a162e7e209a3d5',
        },
        {
          url: '/images/exercises/image_00148-47aead12d25992d72536450f7edd1643.png',
          revision: '47aead12d25992d72536450f7edd1643',
        },
        {
          url: '/images/exercises/image_00149-273a58dd3bdd5cc87ace6e9adf77ae82.png',
          revision: '273a58dd3bdd5cc87ace6e9adf77ae82',
        },
        {
          url: '/images/exercises/image_00150-c6265918ff8ede8b0d8a546206580ead.png',
          revision: 'c6265918ff8ede8b0d8a546206580ead',
        },
        {
          url: '/images/exercises/image_00151-50d5ed1df8adc9cb6e22b5b470767a06.png',
          revision: '50d5ed1df8adc9cb6e22b5b470767a06',
        },
        {
          url: '/images/exercises/image_00152-e12eae0f8b163f4afb1ff25c565e6c00.png',
          revision: 'e12eae0f8b163f4afb1ff25c565e6c00',
        },
        {
          url: '/images/exercises/image_00153-2642a1a3f3072ea2ecc4d1cec81b9af4.png',
          revision: '2642a1a3f3072ea2ecc4d1cec81b9af4',
        },
        {
          url: '/images/exercises/image_00154-f5e02f3638ede3410b143d22b440ecbf.png',
          revision: 'f5e02f3638ede3410b143d22b440ecbf',
        },
        {
          url: '/images/exercises/image_00155-588b56678ca486f54226601cfc5f6d20.png',
          revision: '588b56678ca486f54226601cfc5f6d20',
        },
        {
          url: '/images/exercises/image_00156-d632cf7385942b466fba8267c163cfd1.png',
          revision: 'd632cf7385942b466fba8267c163cfd1',
        },
        {
          url: '/images/exercises/image_00157-e76701cf977c7fef7cf4ac6af24754b9.png',
          revision: 'e76701cf977c7fef7cf4ac6af24754b9',
        },
        {
          url: '/images/exercises/image_00160a-af4499d4f5493961f775c4551ad076ca.png',
          revision: 'af4499d4f5493961f775c4551ad076ca',
        },
        {
          url: '/images/exercises/image_00161-034d1c687cc8876cecbbb383a8c8bb69.png',
          revision: '034d1c687cc8876cecbbb383a8c8bb69',
        },
        {
          url: '/images/exercises/image_00163-cdcdfec97cc329b5401edd879b25a72e.png',
          revision: 'cdcdfec97cc329b5401edd879b25a72e',
        },
        {
          url: '/images/exercises/image_00164-de0f83243efcbe4bcde744975c78eb55.png',
          revision: 'de0f83243efcbe4bcde744975c78eb55',
        },
        {
          url: '/images/exercises/image_00166-9e4e43fd88a4e4c1664965e7da941793.png',
          revision: '9e4e43fd88a4e4c1664965e7da941793',
        },
        {
          url: '/images/exercises/image_00168-05cede7eaa194529ad4e5efa782cacbd.png',
          revision: '05cede7eaa194529ad4e5efa782cacbd',
        },
        {
          url: '/images/exercises/image_00169-82a2e50a68ddb31323bd528b29f2de3b.png',
          revision: '82a2e50a68ddb31323bd528b29f2de3b',
        },
        {
          url: '/images/exercises/image_00170-1fb65f8871119c0ff3934ef47d9a8bd9.png',
          revision: '1fb65f8871119c0ff3934ef47d9a8bd9',
        },
        {
          url: '/images/exercises/image_00171-080b3021ab72183a07cf83639bbc327b.png',
          revision: '080b3021ab72183a07cf83639bbc327b',
        },
        {
          url: '/images/exercises/image_00172-e65f8b291d9bcb14b84a3c2b482c53e2.png',
          revision: 'e65f8b291d9bcb14b84a3c2b482c53e2',
        },
        {
          url: '/images/exercises/image_00173-a56db56c74a9c0162de1fa44cd14dd7b.png',
          revision: 'a56db56c74a9c0162de1fa44cd14dd7b',
        },
        {
          url: '/images/exercises/image_00174-df7788ec445bb972924320b979f279d5.png',
          revision: 'df7788ec445bb972924320b979f279d5',
        },
        {
          url: '/images/exercises/image_00175-ef2214a78d37d24f0ee285e9a37285ff.png',
          revision: 'ef2214a78d37d24f0ee285e9a37285ff',
        },
        {
          url: '/images/exercises/image_00176-256a2c50d08903f1b539863747dd8fd9.png',
          revision: '256a2c50d08903f1b539863747dd8fd9',
        },
        {
          url: '/images/exercises/image_00177-5150a84d59397a26ecfa6f78b5ff8c49.png',
          revision: '5150a84d59397a26ecfa6f78b5ff8c49',
        },
        {
          url: '/images/exercises/image_00178-252dc0edbf06330e68cd84570793b722.png',
          revision: '252dc0edbf06330e68cd84570793b722',
        },
        {
          url: '/images/exercises/image_00183-fcd569c29ca8160c4d16f22868418b1f.png',
          revision: 'fcd569c29ca8160c4d16f22868418b1f',
        },
        {
          url: '/images/exercises/image_00184-401117abcede0f4595a59199bdb8f986.png',
          revision: '401117abcede0f4595a59199bdb8f986',
        },
        {
          url: '/images/exercises/image_00186-7187fd0ddfd9c3b08e4c781a15a3f461.png',
          revision: '7187fd0ddfd9c3b08e4c781a15a3f461',
        },
        {
          url: '/images/exercises/image_00189a-334666822f855130150de95d51d067b5.png',
          revision: '334666822f855130150de95d51d067b5',
        },
        {
          url: '/images/exercises/image_00190c-be4c5b79eb9cdbc29ed70e3c946a26eb.png',
          revision: 'be4c5b79eb9cdbc29ed70e3c946a26eb',
        },
        {
          url: '/images/exercises/image_00201-70102acce87770075a4facd9ef5eb8bb.png',
          revision: '70102acce87770075a4facd9ef5eb8bb',
        },
        {
          url: '/images/exercises/image_00207-f5afda03eb033d4ff0cf080ca01012f9.png',
          revision: 'f5afda03eb033d4ff0cf080ca01012f9',
        },
        {
          url: '/images/exercises/image_00218-1b4752a4051c837515c1c8d48c0e53fb.png',
          revision: '1b4752a4051c837515c1c8d48c0e53fb',
        },
        {
          url: '/images/exercises/image_00219c-de97158da6ebc779289ade4dcfac15cb.png',
          revision: 'de97158da6ebc779289ade4dcfac15cb',
        },
        {
          url: '/images/exercises/image_00220a-034ab3be53ed964a4ad840de46b27f4d.png',
          revision: '034ab3be53ed964a4ad840de46b27f4d',
        },
        {
          url: '/images/exercises/image_00221b-5f17468cf3abcc33359813eab3b2f53c.png',
          revision: '5f17468cf3abcc33359813eab3b2f53c',
        },
        {
          url: '/images/exercises/image_00222b-57f9c95a9e12adac4c93e565bb1ac998.png',
          revision: '57f9c95a9e12adac4c93e565bb1ac998',
        },
        {
          url: '/images/exercises/image_00223b-7152e76d9e2e7dd480fedb4924d622e3.png',
          revision: '7152e76d9e2e7dd480fedb4924d622e3',
        },
        {
          url: '/images/exercises/image_00224b-29835a5abd324dedfba7c8b573afdde2.png',
          revision: '29835a5abd324dedfba7c8b573afdde2',
        },
        {
          url: '/images/exercises/image_00225-e389e294bca776b0406414689dbf5360.png',
          revision: 'e389e294bca776b0406414689dbf5360',
        },
        {
          url: '/images/exercises/image_00226a-89a5310701e494db2e493967186f28d5.png',
          revision: '89a5310701e494db2e493967186f28d5',
        },
        {
          url: '/images/exercises/image_00227b-7e815ddb054420195ca2f3be276451d1.png',
          revision: '7e815ddb054420195ca2f3be276451d1',
        },
        {
          url: '/images/exercises/image_00228b-60bc1b537089c91dd5395f7b1663ec6c.png',
          revision: '60bc1b537089c91dd5395f7b1663ec6c',
        },
        {
          url: '/images/exercises/image_00229c-5b58b26daf025487fc9ab4f95dcf4980.png',
          revision: '5b58b26daf025487fc9ab4f95dcf4980',
        },
        {
          url: '/images/exercises/image_00233c-6d91e92702ce68b804ce22fe03f4ef68.png',
          revision: '6d91e92702ce68b804ce22fe03f4ef68',
        },
        {
          url: '/images/exercises/image_00235a-6d68db81c1868447d1bd2eab639f89c6.png',
          revision: '6d68db81c1868447d1bd2eab639f89c6',
        },
        {
          url: '/images/exercises/image_00236a-f899933bfcde9262815bf1c9547add6a.png',
          revision: 'f899933bfcde9262815bf1c9547add6a',
        },
        {
          url: '/images/exercises/image_00237a-033fa40c48352947cede12a4cd749d75.png',
          revision: '033fa40c48352947cede12a4cd749d75',
        },
        {
          url: '/images/exercises/image_00238b-e919c80b31abb744fc9ba1b239e1fae7.png',
          revision: 'e919c80b31abb744fc9ba1b239e1fae7',
        },
        {
          url: '/images/exercises/image_00242c-615a5c1e790effff179183c728c6be4d.png',
          revision: '615a5c1e790effff179183c728c6be4d',
        },
        {
          url: '/images/exercises/image_00245a-71c96c55727c6e4a983b586506d595f4.png',
          revision: '71c96c55727c6e4a983b586506d595f4',
        },
        {
          url: '/images/exercises/image_00246a-f22559fccbc617d7f8da2fad966b8e58.png',
          revision: 'f22559fccbc617d7f8da2fad966b8e58',
        },
        {
          url: '/images/exercises/image_00253a-152f2a1dded6ca93a8cd62f13dfd51ad.png',
          revision: '152f2a1dded6ca93a8cd62f13dfd51ad',
        },
        {
          url: '/images/exercises/image_00254a-df70af0a135ebafef711de979d635b4d.png',
          revision: 'df70af0a135ebafef711de979d635b4d',
        },
        {
          url: '/images/exercises/image_00255c-0f40302919af63bec5f6a80e17828284.png',
          revision: '0f40302919af63bec5f6a80e17828284',
        },
        { url: '/manifest.json', revision: 'ba90e2a86d6b8fd1a8971e6903f684a9' },
        { url: '/og-image.png', revision: 'cd30491cd4e4564c9435414840d66b32' },
        {
          url: '/service-worker.js',
          revision: '49138a4d4276a6a76b785f9c1014e95f',
        },
        {
          url: '/sounds/beep-long.mp3',
          revision: '9114caecbda9d93dbf2e29ca0fc535e0',
        },
        {
          url: '/sounds/beep-short.mp3',
          revision: '7aba5d083f1c2a7613ef48fcbb5c63cc',
        },
        {
          url: '/sounds/beep-start.mp3',
          revision: '834ab20d79ea5f2150e31ceb623df292',
        },
        {
          url: '/sounds/timer-loop.mp3',
          revision: 'bca465446669b44dbebff25df799f59f',
        },
        {
          url: '/sounds/victory.mp3',
          revision: '236751575df53973dcbf4b8eedcfa323',
        },
        {
          url: '/swe-worker-5c72df51bb1f6ee0.js',
          revision: '5a47d90db13bb1309b25bdf7b363570e',
        },
      ],
      { ignoreURLParametersMatching: [/^utm_/, /^fbclid$/] },
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      '/',
      new e.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: async ({ response: e }) =>
              e && 'opaqueredirect' === e.type
                ? new Response(e.body, {
                    status: 200,
                    statusText: 'OK',
                    headers: e.headers,
                  })
                : e,
          },
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: 'google-fonts-webfonts',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new e.StaleWhileRevalidate({
        cacheName: 'google-fonts-stylesheets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-font-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-image-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 2592e3 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\/_next\/static.+\.js$/i,
      new e.CacheFirst({
        cacheName: 'next-static-js-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'next-image',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new e.CacheFirst({
        cacheName: 'static-audio-assets',
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:mp4|webm)$/i,
      new e.CacheFirst({
        cacheName: 'static-video-assets',
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-js-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 48, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-style-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'next-data',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new e.NetworkFirst({
        cacheName: 'static-data-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      ({ sameOrigin: e, url: { pathname: a } }) =>
        !(!e || a.startsWith('/api/auth/callback') || !a.startsWith('/api/')),
      new e.NetworkFirst({
        cacheName: 'apis',
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      ({ request: e, url: { pathname: a }, sameOrigin: i }) =>
        '1' === e.headers.get('RSC') &&
        '1' === e.headers.get('Next-Router-Prefetch') &&
        i &&
        !a.startsWith('/api/'),
      new e.NetworkFirst({
        cacheName: 'pages-rsc-prefetch',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      ({ request: e, url: { pathname: a }, sameOrigin: i }) =>
        '1' === e.headers.get('RSC') && i && !a.startsWith('/api/'),
      new e.NetworkFirst({
        cacheName: 'pages-rsc',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      ({ url: { pathname: e }, sameOrigin: a }) => a && !e.startsWith('/api/'),
      new e.NetworkFirst({
        cacheName: 'pages',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      ({ sameOrigin: e }) => !e,
      new e.NetworkFirst({
        cacheName: 'cross-origin',
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 }),
        ],
      }),
      'GET',
    ),
    (self.__WB_DISABLE_DEV_LOGS = !0));
});
