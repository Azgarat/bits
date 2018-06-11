новое поле на таблице server  +
поле backup_status +
если на сервере в поле статус содержится fail +
нужно найти все чейнджи в которых affected CI есть этот сервер
и создать task в описании сnатус fail и название сервера

ищем по серверам фэйл -> глайд рекорд -> ищем таблицу аффктед -> третим создать таск

//background script
var gr = new GlideRecord('cmdb_ci_server');
	gr.addQuery('backup_status', 'fail'); 
	gr.query();
	while(gr.next()){
		var serverID = gr.sys_id;
		var name = gr.name;
		var bs =  gr.u_backup_status;
		if(bs.indexOf('fail')> -1){ //lookup for all servers wich bs contains 'fail'
		
			//optional: tracing
			gs.print('@@@ server ' + name + ' (' + serverID + ') ' + 'backup status: ' +  bs); 
			
			var chreq = new GlideRecord('task_ci');
				chreq.addQuery('ci_item', serverID);
				chreq.query();
				while(chreq.next()){
					var n = chreq.task; //Change Request ID for related task
					var reqnum = chreq.task.number; //Change Request number
					
					//optional: tracing Change Request ID 
					gs.print('Change ID: ' + n); 
					//optional: tracing Change Request number
					gs.print('Change number: ' + reqnum);

					var task = new GlideRecord('change_task');
						task.initialize();
						task.change_request = n
						task.short_description = 'backup status: ' +  bs + ' @ ' + name;
						task.description = 'backup status: ' +  bs + ' @ ' + name;
						task.insert();
						gs.print('task created ' + task.number + '. backup status: ' +  bs + ' @ ' + name);

				}
		}
	}

теперь нужно переделать это в бизнес руль с некоторыми дополнениями: 
когда в бекап статус проставляется fail, 
мы должны найти все активные ченджи на команде бекап с этим сервером, и если там есть таск, то обновить его с информацией о сервере, а если таска нет - создать.	


var queStr = 'assignment_group=eee8777a0fa213009faf409ce1050ef7';
var gr = new GlideRecord('change_request');
	gr.addEncodedQuery(queStr);//assigned to FJ Backup group
	gr.addActiveQuery(); 
	gr.query();
	while (gr.next()){
		//optional: tracing Assignment group ID 
		var ag = gr.assignment_group;
		gs.print('Assignment group ' + ag.getDisplayValue());
		
		/*
		//optional: tracing Change Request Number 
		var cNum = gr.number;
		gs.print('Change Request Number ' + cNum);
		*/
		
		var ci = gr.cmdb_ci
		gs.print('Configuration Item ' + ci.getDisplayValue()); // OK
		
		var chreq = new GlideRecord('task_ci');
			chreq.addQuery('ci_item', ci);
			chreq.query();
			while(chreq.next()){
				//var n = chreq.task; //Change Request ID for related task
				var reqnum = chreq.task.number; //Change Request number
				gs.print('@@@ Related Change Request number ' + chreq.task.number); //OK
				
				
				var chTask = new GlideRecord('change_task');
					chTask.addQuery('change_request', chreq.task); 
					chTask.addActiveQuery(); 
					chTask.query();
					while(chTask.next()){
						gs.print('Associated Task number ' + chTask.number); //OK
					}
				/*
					chreq.addQuery('ci_item', ci);
						if(){
							task.initialize();
							task.change_request = n
							task.short_description = 'backup status: ' +  bs + ' @ ' + name;
							task.description = 'backup status: ' +  bs + ' @ ' + name;
							task.insert();
							gs.print('task created ' + task.number + '. backup status: ' +  bs + ' @ ' + name);
						} else {
							task.initialize();
							task.short_description = 'backup status: ' +  bs + ' @ ' + name;
							task.description = 'backup status: ' +  bs + ' @ ' + name;
							task.update();
							gs.print('task updated ' + task.number + '. backup status: ' +  bs + ' @ ' + name);
						}
				*/		
			}
	}

//business rule