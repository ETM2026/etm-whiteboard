// Conflict decisions are independent of clocks and transport. Tombstones are retained.
var ETM_SYNC_CORE=(function(){
 function key(r){return JSON.stringify([r.owner,r.collection,r.id])}
 function stamp(value){var text=JSON.stringify(value);return text.length+':'+ETM_STUDY.hash(text)}
 function pending(snapshot,meta){var out=[];Object.keys(snapshot).forEach(function(k){var r=snapshot[k],m=meta[k];if(!m||m.hash!==stamp(r.value))out.push({...r,version:m?.version||0})});Object.keys(meta).forEach(function(k){if(JSON.parse(k)[1]==='pieces'&&!snapshot[k]&&meta[k].hash!==stamp(null)){var a=JSON.parse(k);out.push({owner:a[0],collection:a[1],id:a[2],value:null,version:meta[k].version})}});return out}
 function decision(local,remote,meta){var dirty=local!==undefined&&(!meta||stamp(local)!==meta.hash);if(!dirty)return 'remote';if(stamp(local)===stamp(remote.value))return 'same';if(meta&&remote.version===meta.version)return 'local';if(remote.collection==='pieces'&&local!==null)return 'copy';if(remote.collection==='private'&&local!==null)return 'archive';if(['learning','study','tables','settings','shared','santa'].includes(remote.collection)&&local!==null&&remote.value!==null)return 'merge';return 'remote'}
 function parts(text){var out=[];for(var start=0;start<text.length;){var end=Math.min(text.length,start+200000);if(end<text.length&&text.charCodeAt(end-1)>=0xD800&&text.charCodeAt(end-1)<=0xDBFF)end--;out.push(text.slice(start,end));start=end}return out}
 return {parts:parts,key:key,stamp:stamp,pending:pending,decision:decision};
})();
