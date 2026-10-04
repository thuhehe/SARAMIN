const HIDE = `nextjs-portal{display:none!important} button[aria-label="Toggle wireframe pages sidebar"]{display:none!important} [class*="styles-module__toolbar"]{display:none!important}`
async function prep(p){ await p.addStyleTag({ content: HIDE }).catch(()=>{}) }
module.exports = { HIDE, prep }
