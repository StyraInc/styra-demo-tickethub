(()=>{"use strict";var t={};t.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(t){if("object"==typeof window)return window}}();class e extends Error{constructor(t,e){super(e?.message?`${t}: ${e.message}`:t),this.name="StyraRunError",this.cause=e}}class n extends e{constructor(t,e,n){super(t),this.name="StyraRunHttpError",this.statusCode=e,this.body=n}}class r extends Error{constructor(){super("Unauthorized")}}function s(t){return!0===t?.result}const i="authz:action";class a{url;callbacks;eventListeners;constructor(t,{callbacks:e={},eventListeners:n=[]}={}){this.url=t,this.callbacks=e,this.eventListeners=n,this.callbacks.disable||(this.callbacks.disable=d),this.callbacks.hide||(this.callbacks.hide=u)}async handleEvent(t,e){this.eventListeners.forEach((n=>n(t,e)))}async query(t,e){return(await this.batchedQuery([{path:t,input:e}]))[0]??{}}async check(t,e,n=s){return n(await this.query(t,e))}async batchedQuery(t,r){if(!Array.isArray(t))throw new Error("'queries' is not a valid array");try{const e=await async function(t,e){const r=await fetch(t,{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json"},dataType:"json",body:JSON.stringify(e)});if(200!==r.status)throw new n(`Unexpected status code: ${r.status}`,r.status,r.text());return await r.json()}(this.url,{items:t,input:r});return this.handleEvent("query",{queries:t,result:e.result}),e.result??[]}catch(n){throw this.handleEvent("query",{queries:t,err:n}),new e("Query failed",n)}}async render(t=document){const e=[...t.querySelectorAll("[authz]")],n=e.map((t=>{const e={path:t.getAttribute("authz")};let n;const r=t.getAttribute("authz:input-func");if(r)n=c(r,this.callbacks)(t);else{const e=t.getAttribute("authz:input");if(e)try{n=JSON.parse(e)}catch{n=e}}return n&&(e.input=n),e}));if(n.length>0){const t=await this.batchedQuery(n);await Promise.allSettled(t.map((async(t,n)=>{const r=e[n];this.handleEvent("authz",{node:r,decision:t}),function(t,e,n){const r=e.getAttribute(i);if(r)c(r,n)(t,e);else{if(e.attributes.hasOwnProperty("hidden"))return e.setAttribute(i,"hide"),void u(t,e);e.setAttribute(i,"disable"),d(t,e)}}(t,r,this.callbacks)})))}}}function c(t,e){const n=e[t];if(n)return n;if(window.hasOwnProperty(t))return window[t];throw Error(`Unknown function '${t}'`)}function o(t){return!0===t?.result}function d(t,e){o(t)?e.removeAttribute("disabled"):e.setAttribute("disabled","true")}function u(t,e){o(t)?e.removeAttribute("hidden"):e.setAttribute("hidden","true")}function l(t,e={}){return new a(t,e)}const h=l("/authz"),p={New:l,check:function(t,e,n=s){return h.check(t,e,n)},render:function(t=document){return h.render(t)}};class b{constructor(t,e,n){this.url=t,this.node=e,this.styraRunClient=n,this.pageIndex=1}renderRoleSelector(t,e,n){const r=document.createElement("select");if(r.onchange=t=>{r.setAttribute("disabled",!0),this.setBinding(n.id,t.target.value)},!e.includes(n?.role)){const t=document.createElement("option");t.setAttribute("disabled",!0),t.setAttribute("selected",!0),t.innerText=n.role||"",r.appendChild(t)}e.forEach((t=>{const e=document.createElement("option");e.innerText=t,e.setAttribute("value",t),n?.role===t&&e.setAttribute("selected",!0),r.appendChild(e)})),t.appendChild(r)}async setBinding(t,e){try{const r=await fetch(`${this.url}/user_bindings/${t}`,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify([e])});if(200!==r.status)throw new n(`Unexpected status code ${resp.status}`,resp.status,r.text());this.styraRunClient.handleEvent("rbac-update",{id:t,role:e})}catch(n){this.styraRunClient.handleEvent("rbac-update",{id:t,role:e,err:n})}await this.renderRbacManagerPage(this.pageIndex)}async handleResponse(t){if(403===t.status)throw new r;return 200==t.status?t.json():{}}async renderRbacManagerPage(t=1){this.pageIndex=t;const[e,n]=await Promise.all([fetch(this.url+"/roles").then(this.handleResponse).then((({result:t})=>t??[])),fetch(this.url+"/user_bindings?page="+t).then(this.handleResponse)]).catch((t=>{if(!(t instanceof r))return this.styraRunClient.handleEvent("rbac",{err:t}),[{},{}];this.renderNotAuthorized()}));this.styraRunClient.handleEvent("rbac",{roles:e,bindings:n});const s=document.createElement("div");s.classList.add("rbac");const i=document.createElement("table");s.appendChild(i),i.innerHTML="    <thead>\n      <tr>\n          <th>User</th>\n          <th>Role</th>\n      </tr>\n    </thead>";const a=document.createElement("tbody");if(i.appendChild(a),n.result){n.result?.forEach((t=>{const[n]=t.roles??[],r={id:t.id,role:n},s=a.insertRow();s.insertCell().appendChild(document.createTextNode(r.id));const i=s.insertCell();this.renderRoleSelector(i,e,r)}));const t=document.createElement("div");t.classList.add("navigation"),s.appendChild(t);const r=n.page;if(r?.index){const e=document.createElement("button");e.innerText="<",e.onclick=()=>this.renderRbacManagerPage(r.index-1),r.index<=1&&e.setAttribute("disabled","true"),t.appendChild(e);const s=document.createElement("div");s.textContent=r.of?`${r.index}/${r.of}`:`${r.index}`,t.appendChild(s);const i=document.createElement("button");i.innerText=">",i.onclick=()=>this.renderRbacManagerPage(r.index+1),(0==n.result.length||r.of&&r.index>=r.of)&&i.setAttribute("disabled","true"),t.appendChild(i)}}this.node.innerHTML="",this.node.appendChild(s)}renderNotAuthorized(){const t=document.createElement("div");t.textContent="You are unauthorized for user role management.",this.node.innerHTML="",this.node.appendChild(t)}async render(){try{await this.renderRbacManagerPage(1)}catch(t){this.styraRunClient.handleEvent("rbac",{err:t}),await this.renderNotAuthorized()}}}t.g.StyraRun=p,t.g.StyraRun.renderRbacManagement=async function(t,e,n=h){const r=document.querySelector(e);if(!r)throw Error(`No element could be found with selector string '${e}'`);const s=new b(t,r,n);await s.render()}})();