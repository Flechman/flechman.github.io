import{_ as i,f,u as p,g as v,r as k,o as L,c as g,b as o,t as l,d as x,w as B,h as r,a as N}from"./app.05e06503.js";const T={class:"theme-container"},b={class:"theme-default-content"},C=f({__name:"404",setup(M){var a,s,n;const u=p(),e=v(),t=(a=e.value.notFound)!=null?a:["Not Found"],m=()=>t[Math.floor(Math.random()*t.length)],_=(s=e.value.home)!=null?s:u.value,d=(n=e.value.backToHome)!=null?n:"Back to home";return(R,c)=>{const h=k("RouterLink");return L(),g("div",T,[o("div",b,[c[0]||(c[0]=o("h1",null,"404",-1)),o("blockquote",null,l(m()),1),x(h,{to:r(_)},{default:B(()=>[N(l(r(d)),1)]),_:1},8,["to"])])])}}});var w=i(C,[["__file","404.vue"]]);export{w as default};