// EIP-6963 discovery; EIP-1193 requests/events on the explicitly selected provider.
export class WalletSession {
  constructor(host,{onChange=()=>{},onDiscovery=()=>{}}={}) {
    this.host=host;this.onChange=onChange;this.onDiscovery=onDiscovery;
    this.providers=new Map();this.selected=null;this.account=null;this.generation=0;this.handlers=[];this.restoring=false;
    this.announce=e=>{const d=e.detail;if(!d?.info||typeof d.info.uuid!=='string'||typeof d.info.name!=='string'||typeof d.info.rdns!=='string'||typeof d.provider?.request!=='function')return;
      if(!this.providers.has(d.info.uuid)){this.providers.set(d.info.uuid,{id:d.info.uuid,info:{name:d.info.name,rdns:d.info.rdns,icon:d.info.icon},provider:d.provider});this.onDiscovery(this.list());}
    };
    host.addEventListener('eip6963:announceProvider',this.announce);
    host.dispatchEvent(new host.Event('eip6963:requestProvider'));
  }
  saved(){try{return JSON.parse(this.host.sessionStorage.getItem('axons.wallet')||'null');}catch{return null;}}
  remember(value){try{if(value)this.host.sessionStorage.setItem('axons.wallet',JSON.stringify(value));else this.host.sessionStorage.removeItem('axons.wallet');}catch{}}
  list(){const found=[...this.providers.values()];if(!found.length&&typeof this.host.ethereum?.request==='function')found.push({id:'legacy',info:{name:'Browser wallet',rdns:'legacy'},provider:this.host.ethereum});return found;}
  unbind(){for(const [p,event,fn] of this.handlers)p.removeListener?.(event,fn);this.handlers=[];}
  bind(entry){this.unbind();this.selected=entry;const p=entry.provider;const listen=(event,fn)=>{p.on?.(event,fn);this.handlers.push([p,event,fn]);};
    listen('accountsChanged',accounts=>{if(this.selected!==entry)return;if(!Array.isArray(accounts)||!accounts.length){this.disconnect();return;}this.account=accounts[0];this.onChange({provider:p,account:this.account});});
    listen('chainChanged',()=>{if(this.selected===entry)this.onChange({provider:p,account:this.account});});
    listen('disconnect',()=>{if(this.selected===entry)this.disconnect();});
  }
  async connect(id){const entry=this.list().find(x=>x.id===id);if(!entry)throw Error('Wallet is no longer available.');const ticket=++this.generation;const accounts=await entry.provider.request({method:'eth_requestAccounts'});if(ticket!==this.generation)return;if(!Array.isArray(accounts)||!accounts.length)throw Error('No account was provided by the wallet.');this.bind(entry);this.account=accounts[0];this.remember({rdns:entry.info.rdns,name:entry.info.name});this.onChange({provider:entry.provider,account:this.account});}
  async restore(){if(this.selected||this.restoring)return;const saved=this.saved();if(!saved)return;const matches=this.list().filter(x=>x.info.rdns===saved.rdns&&x.info.name===saved.name);if(matches.length!==1)return;const entry=matches[0],ticket=this.generation;this.restoring=true;try{const accounts=await entry.provider.request({method:'eth_accounts'});if(ticket!==this.generation||this.selected)return;if(Array.isArray(accounts)&&accounts.length){this.bind(entry);this.account=accounts[0];this.onChange({provider:entry.provider,account:this.account});}}catch{}finally{this.restoring=false;}}
  cancelPending(){++this.generation;}
  disconnect(){++this.generation;this.unbind();this.selected=null;this.account=null;this.remember(null);this.onChange({provider:null,account:null});}
  get provider(){return this.selected?.provider||null;}
  destroy(){this.unbind();this.host.removeEventListener('eip6963:announceProvider',this.announce);++this.generation;}
}
