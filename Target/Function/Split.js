var o=async(e,u,l)=>{const n=[],s=[];for(let t=0;t<e.length;t++)await l(e[t],t,e,u)?n.push(e[t]):s.push(e[t]);return[n,s]};export{o as default};
