class SyncManager{constructor(e,t={}){this.model=e,this.syncUrl=t.syncUrl,this.idField=t.idField||"_id",this.timestampField=t.timestampField||"updatedAt",this.minRequiredSpace=t.minRequiredSpace||52428800,this.syncStatusField=t?.syncStatus||"_syncStatus",this.serverIdField=t?.serverId||"_id",this.lastSyncField=t?.lastSync||"_lastSync",this.batchSize=t.batchSize||50,this.conflictResolution=t.conflictResolution||"server-wins"}async prepareSyncSchema(){const e={[this.syncStatusField]:{type:String,default:"synced"},[this.lastSyncField]:Date,_syncErrors:Array,_localUpdatedAt:Date};this.model.schema?.definition[this.serverIdField]||(e[this.serverIdField]={type:String,unique:!0}),Object.assign(this.model.schema.definition,e)}async pullFromServer(e=null){try{const t=await fetch(this.syncUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lastSync:e,batchSize:this.batchSize})}),s=await t.json();for(const e of s.items){const t=await this.model.find({[this.serverIdField]:e[this.idField]});t&&0!==t.length?await this.handleConflict(t,e):await this.model.create({...e,[this.serverIdField]:e[this.idField],[this.syncStatusField]:"synced",[this.lastSyncField]:new Date})}return{success:!0,synchronized:s.items.length}}catch(e){return{success:!1,error:e.message}}}async pushToServer(){try{const e=(await this.model.find({[this.syncStatusField]:"modified"})).map((e=>({id:e[this.serverIdField],data:this.prepareForSync(e),localId:e[this.idField]}))),t=await fetch(`${this.syncUrl}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({changes:e})}),s=await t.json();for(const e of s.synchronized)await this.model.update({[this.syncStatusField]:"synced",[this.serverIdField]:e.serverId,[this.lastSyncField]:new Date},e.localId);return{success:!0,synchronized:s.synchronized.length}}catch(e){return{success:!1,error:e.message}}}async sync(){try{const e=await this.pushToServer(),t=await this.getLastSyncTimestamp(),s=await this.pullFromServer(t);return{success:!0,pushed:e.synchronized||0,pulled:s.synchronized||0}}catch(e){return{success:!1,error:e.message}}}async handleConflict(e,t){return await e.map((async s=>{if("server-wins"===this.conflictResolution)return await this.model.update({...t,[this.serverIdField]:t[this.idField],[this.syncStatusField]:"synced",[this.lastSyncField]:new Date},s[this.idField]);if("client-wins"===this.conflictResolution){if("modified"!==e[this.syncStatusField])return await this.model.update({...t,[this.serverIdField]:t[this.idField],[this.syncStatusField]:"synced",[this.lastSyncField]:new Date},s[this.idField])}else if("manual"===this.conflictResolution)return await this.model.update({...e,[this.syncStatusField]:"conflict",_serverVersion:t},s[this.idField])}))}async getLastSyncTimestamp(){const e=await this.model.find({[this.syncStatusField]:"synced"}).then((async e=>await this.model.sort({fields:e,keyField:{name:this.lastSyncField,type:"date"},order:"desc"}))).then((async e=>await this.model.limit({fields:e,limit:1}))).catch((e=>{}));return e.length>0?e[0][this.lastSyncField]:null}prepareForSync(e){const t={...e};return delete t[this.syncStatusField],delete t[this.serverIdField],delete t[this.lastSyncField],delete t._syncErrors,delete t._localUpdatedAt,t}async watchChanges(){const e=this.model.update.bind(this.model),t=this.model.create.bind(this.model);this.model.update=async(t,s)=>{const i={...t,[this.syncStatusField]:"modified",_localUpdatedAt:new Date};return e(i,s)},this.model.create=async e=>{const s={...e,[this.syncStatusField]:"modified",_localUpdatedAt:new Date};return t(s)}}setupAutoSync(e=3e5){setInterval((()=>{this.sync().catch(console.error)}),e)}}export{SyncManager};