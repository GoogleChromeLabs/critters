import Critters from '../src/index';
import * as cheerio from 'cheerio';

function hasEvilOnload(html) {
  const $ = cheerio.load(html, { scriptingEnabled: true });
  return $('[onload]').attr('onload').includes(`''-alert(1)-''`);
}

function hasEvilScript(html) {
  const $ = cheerio.load(html, { scriptingEnabled: true });
  const scripts = Array.from($('script'));
  return scripts.some((s) => s.textContent.trim() === 'alert(1)');
}

describe('Critters', () => {
  it('should not decode entities', async () => {
    const critters = new Critters({});
    const html = await critters.process(`
            <html>
                <body>
                    &lt;script&gt;alert(1)&lt;/script&gt;
        `);
    expect(hasEvilScript(html)).toBeFalsy();
  });
  it('should not create a new script tag from embedding linked stylesheets', async () => {
    const critters = new Critters({});
    critters.readFile = () =>
      `* { background: url('</style><script>alert(1)</script>') }`;
    const html = await critters.process(`
            <html>
                <head>
                    <link rel=stylesheet href=/file.css>
                </head>
                <body>
                </body>
        `);
    expect(hasEvilScript(html)).toBeFalsy();
  });
  it('should not create a new script tag from embedding additional stylesheets', async () => {
    const critters = new Critters({
      additionalStylesheets: ['/style.css']
    });
    critters.readFile = () =>
      `* { background: url('</style><script>alert(1)</script>') }`;
    const html = await critters.process(`
            <html>
                <head>

                </head>
                <body>
                </body>
        `);
    expect(hasEvilScript(html)).toBeFalsy();
  });

  it('should not create a new script tag by ending </script> from href', async () => {
    const critters = new Critters({ preload: 'js' });
    critters.readFile = () => `* { background: red }`;
    const html = await critters.process(`
        <html>
            <head>
                <link rel=stylesheet href="/abc/</script><script>alert(1)</script>/style.css">
            </head>
            <body>
            </body>
    `);
    expect(hasEvilScript(html)).toBeFalsy();
  });
});
