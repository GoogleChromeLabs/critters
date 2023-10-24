const f=(t,s)=>{t.nodes=t.nodes.filter(e=>(hasNestedRules(e)&&f(e,s),e._other=void 0,e.filterSelectors=filterSelectors,s(e)!==!1))};var n=f;export{f as _Function,n as default};
