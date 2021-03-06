(() => {

var CONST = window.COMMON.getConst({
	numBattlesMax: 9,
	numCompMax: 12,
	
	numSimDefault: 10000,
	numSimMax: 99999,
	
	urlDeckbuilder: 'http://www.kancolle-calc.net/deckbuilder.html?predeck=',
	urlKCNavEnemyComps: 'https://tsunkit.net/api/routing/enemycomps',
	urlKCNavFriendFleets: 'https://tsunkit.net/api/routing/friendfleets',
	kcnavEventFirst: 42,
	// kcnavDaysMax: 30,
	kcnavDateStart: '2019-03-22',
});

var MECHANICS_LIST = [
	{ key: 'artillerySpotting', name: 'Artillery Spotting' },
	{ key: 'AACI', name: 'Anti-Air Cut-In' },
	{ key: 'fitGun', name: 'Fit Gun' },
	{ key: 'OASW', name: 'Opening ASW' },
	{ key: 'CVCI', name: 'Carrier Cut-In' },
	{ key: 'destroyerNBCI', name: 'Destroyer NB Cut-In' },
	{ key: 'LBASBuff', name: 'LBAS/Support Revamp (Fall 17)' },
	{ key: 'eqBonus', name: 'Equipment Bonus' },
	{ key: 'installRevamp', name: 'New Soft-Skin Installation Mods' },
	{ key: 'newSupply', name: 'New Fuel/Ammo Node Costs' },
	{ key: 'enable_echelon', name: 'New Echelon Mods' },
	{ key: 'aaResist', name: 'Anti-Air Resist' },
	{ key: 'divebomberInstall', name: 'Divebomber Installation Targeting' },
	{ key: 'enable_DDCI', name: 'Destroyer NB Cut-In Buff (Double Hit)' },
	{ key: 'subFleetAttack', name: 'Submarine Fleet Attack' },
	{ key: 'kongouSpecialBuff', name: 'Kongou Special Buff' },
	{ key: 'coloradoSpecialFix', name: 'Colorado Special Fix' },
	{ key: 'eqBonusTorp', name: 'Torpedo Airstrike Use Equipment Bonus' },
	{ key: 'eqBonusASW', name: 'ASW Use Equipment Bonus' },
];




var UI_MAIN = Vue.createApp({
	data: () => ({
		fleetFMain: FLEET_MODEL.getBlankFleet({ isPlayer: 1 }),
		fleetFSupportN: FLEET_MODEL.getBlankFleet({ isSupport: 1 }),
		fleetFSupportB: FLEET_MODEL.getBlankFleet({ isSupport: 1 }),
		fleetsFFriend: [],
		landBases: FLEET_MODEL.getBlankLandBases(),
		lbExpanded: false,
		useSupportN: true,
		useSupportB: true,
		useFF: true,
		
		battles: [],
		
		settings: {
			retreatOnTaiha: true,
			mechanics: [],
			shellDmgCap: SIMCONSTS.shellDmgCap,
			aswDmgCap: SIMCONSTS.aswDmgCap,
			torpedoDmgCap: SIMCONSTS.torpedoDmgCap,
			nightDmgCap: SIMCONSTS.nightDmgCap,
			airDmgCap: SIMCONSTS.airDmgCap,
			supportDmgCap: SIMCONSTS.supportDmgCap,
			airRaidCostW6: SIMCONSTS.airRaidCostW6,
			showAdvanced: false,
			vanguardEvShellDD: SIMCONSTS.vanguardEvShellDD.slice(),
			vanguardEvTorpDD: SIMCONSTS.vanguardEvTorpDD.slice(),
			vanguardEvShellOther: SIMCONSTS.vanguardEvShellOther.slice(),
			vanguardEvTorpOther: SIMCONSTS.vanguardEvTorpOther.slice(),
			nelsonTouchRate: SIMCONSTS.nelsonTouchRate,
			nagatoSpecialRate : SIMCONSTS.nagatoSpecialRate,
			mutsuSpecialRate : SIMCONSTS.mutsuSpecialRate,
			coloradoSpecialRate : SIMCONSTS.coloradoSpecialRate,
			kongouSpecialRate : SIMCONSTS.kongouSpecialRate,
			bucketPercent: BUCKETPERCENT*100,
			bucketTime: BUCKETTIME/3600,
			carryOverHP: CARRYOVERHP,
			carryOverMorale: CARRYOVERMORALE,
		},
		
		canSim: true,
		numSim: CONST.numSimDefault,
		simProgress: 0,
		results: {
			active: false,
			showCFWarning: false,
			isFromImport: false,
			errors: [],
			warnings: [],
			numNodes: 0,
			hasCF: false,
			hasSF: false,
			totalNum: 0,
			rankS: 0, rankA: 0, rankB: 0, rankC: 0, rankD: 0, rankE: 0, retreat: 0,
			flagSunk: 0, flagSunkHP: 0, flagSunkHPBoss: 0,
			rankSNode: [], rankANode: [], rankBNode: [], rankCNode: [], rankDNode: [], rankENode: [], flagSunkNode: [],
			mvp1: [], mvp2: [], mvp3: [], mvp4: [], mvp5: [], mvp6: [], mvp7: [],
			mvpE1: [], mvpE2: [], mvpE3: [], mvpE4: [], mvpE5: [], mvpE6: [],
			airASP: [], airAS: [], airAP: [], airAD: [], airAI: [],
			taiha: [],
			taiha1: [], taiha2: [], taiha3: [], taiha4: [], taiha5: [], taiha6: [], taiha7: [],
			taihaE1: [], taihaE2: [], taihaE3: [], taihaE4: [], taihaE5: [], taihaE6: [],
			noChuuha: [],
			fuelSupply: 0, ammoSupply: 0, bauxSupply: 0,
			fuelRepair: 0, steelRepair: 0, bucket: 0, damecon: 0,
			fuelS: 0, ammoS: 0, steelS: 0, bauxS: 0, bucketS: 0, dameconS: 0,
			fuelSunk: 0, ammoSunk: 0, steelSunk: 0, bauxSunk: 0, bucketSunk: 0, dameconSunk: 0,
			emptiedPlane: 0, emptiedLBAS: 0,
		},
		
		lang: 'en',
		canSave: false,
	}),
	mounted: function() {
		this.$i18n.locale = localStorage.sim2_lang || 'en';
		
		this.addNewComp(this.fleetsFFriend,{ isFriend: 1 });
		
		for (let obj of MECHANICS_LIST) {
			this.settings.mechanics.push({ key: obj.key, name: obj.name, enabled: true });
		}
		this.addNewBattle();
		
		initEQDATA(() => {
			document.body.style = '';
			let dataSave = null;
			let finishInit = function() {
				CONVERT.loadSave(dataSave,this);
				this.canSave = true;
			}.bind(this);
			if (window.location.hash.length >= 3) {
				let dataHash;
				try {
					dataHash = JSON.parse(decodeURIComponent(window.location.hash.substr(1)));
				} catch(e) {
					console.log('bad JSON hash:');
					console.error(e);
				}
				window.location.hash = '';
				if (dataHash) {
					if (dataHash.fleet1 && dataHash.battles && !dataHash.source) { //replay import
						console.log('replay import');
						let dataReplay = dataHash;
						dataSave = CONVERT.replayToSave(dataReplay);
						this.settings.airRaidCostW6 = dataReplay.world == 6;
						if (localStorage.sim2 && !CONVERT.saveIsEmpty(JSON.parse(localStorage.sim2))) {
							let style = document.createElement('style');
							style.innerText = '#divMain > *, #divOther { display: none; }';
							document.head.appendChild(style);
							UI_BACKUP.doOpen(() => { document.head.removeChild(style); finishInit(); });
							return;
						}
					} else if (dataHash.fleetF && dataHash.nodes) { //sim data
						console.log('sim data');
						this.initSimImport(dataHash);
						return;
					}
				}
			}
			window.location.hash = '';
			if (!dataSave && localStorage.sim2) {
				dataSave = JSON.parse(localStorage.sim2);
			}
			finishInit();
		});
	},
	computed: {
		canDeleteBattles: function() {
			return this.battles.length > 1;
		},
	},
	methods: {
		addNewBattle: function(indAt) {
			if (this.battles.length >= CONST.numBattlesMax) return;
			indAt = indAt != null ? indAt : this.battles.length;
			let battle = {
				id: COMMON.ID_GEN.nextId('battle'),
				ind: indAt,
				
				formation: this.fleetFMain.combined ? CONST.formationCombinedDefault : CONST.formationSingleDefault,
				nodeType: CONST.NODE_NORMAL,
				doNB: false,
				lbasWaves: [false,false,false,false,false,false],
				addCostFuel: null,
				addCostAmmo: null,
				subOnly: false,
					
				enemyComps: [],
			};
			for (let i=indAt; i<this.battles.length; i++) {
				this.battles[i].ind++;
			}
			this.battles.splice(indAt,0,battle);
			this.addNewComp(battle.enemyComps,{ isEnemy: 1 });
		},
		deleteBattle: function(indAt,elFrom) {
			if (this.battles.length <= 1) return;
			COMMON.global.fleetEditorMoveTemp(elFrom);
			for (let i=indAt; i<this.battles.length; i++) {
				this.battles[i].ind--;
			}
			this.battles.splice(indAt,1);
		},
		addNewComp: function(comps,args) {
			if (comps.length >= CONST.numCompMax) return;
			let comp = {
				num: comps.length+1,
				rate: 0,
				fleet: FLEET_MODEL.getBlankFleet(args || (comps[0] && comps[0].fleet)),
			};
			comps.push(comp);
		},
		deleteComp: function(comps,elFrom) {
			if (comps.length <= 1) return;
			COMMON.global.fleetEditorMoveTemp(elFrom);
			comps.pop();
		},
		
		updateResults: function(resultSim) {
			for (let key in this.results) {
				if (key == 'errors' || key == 'warnings') continue;
				if (Array.isArray(this.results[key])) {
					this.results[key] = [];
				}
			}
					
			let formatNum = (num) => Math.round(1000*num)/1000;
			
			let totalNum = resultSim.totalnum;
			this.results.totalNum = totalNum;
			this.results.numNodes = resultSim.nodes.length;
			this.results.hasCF = this.fleetFMain.combined;
			this.results.hasSF = this.fleetFMain.type == CONST.SF;
			
			let nodeLast = resultSim.nodes.at(-1);
			for (let letter in nodeLast.ranks) {
				let key = 'rank'+letter;
				this.results[key] = formatNum(nodeLast.ranks[letter] / totalNum);
			}
			this.results.retreat = formatNum((totalNum-nodeLast.num) / totalNum);
			this.results.flagSunk = formatNum(nodeLast.flagsunk / totalNum);
			this.results.flagSunkHP = formatNum(resultSim.totalGaugeDamage / totalNum);
			this.results.flagSunkHPBoss = formatNum(resultSim.totalGaugeDamage / nodeLast.num);
			
			this.results.fuelSupply = formatNum(resultSim.totalFuelS / totalNum);
			this.results.ammoSupply = formatNum(resultSim.totalAmmoS / totalNum);
			this.results.bauxSupply = formatNum(resultSim.totalBauxS / totalNum);
			this.results.fuelRepair = formatNum(resultSim.totalFuelR / totalNum);
			this.results.steelRepair = formatNum(resultSim.totalSteelR / totalNum);
			this.results.bucket = formatNum(resultSim.totalBuckets / totalNum);
			this.results.damecon = formatNum(resultSim.totalDamecon / totalNum);
			
			let rateS = nodeLast.ranks.S / totalNum;
			this.results.fuelS = formatNum((resultSim.totalFuelS + resultSim.totalFuelR) / totalNum / rateS);
			this.results.ammoS = formatNum((resultSim.totalAmmoS) / totalNum / rateS);
			this.results.steelS = formatNum((resultSim.totalSteelR) / totalNum / rateS);
			this.results.bauxS = formatNum((resultSim.totalBauxS) / totalNum / rateS);
			this.results.bucketS = formatNum((resultSim.totalBuckets) / totalNum / rateS);
			this.results.dameconS = formatNum((resultSim.totalDamecon) / totalNum / rateS);
			
			this.results.emptiedPlane = formatNum(resultSim.totalEmptiedPlanes / totalNum);
			this.results.emptiedLBAS = formatNum(resultSim.totalEmptiedLBAS / totalNum);
			
			let rateSunk = nodeLast.flagsunk / totalNum;
			this.results.fuelSunk = formatNum((resultSim.totalFuelS + resultSim.totalFuelR) / totalNum / rateSunk);
			this.results.ammoSunk = formatNum((resultSim.totalAmmoS) / totalNum / rateSunk);
			this.results.steelSunk = formatNum((resultSim.totalSteelR) / totalNum / rateSunk);
			this.results.bauxSunk = formatNum((resultSim.totalBauxS) / totalNum / rateSunk);
			this.results.bucketSunk = formatNum((resultSim.totalBuckets) / totalNum / rateSunk);
			this.results.dameconSunk = formatNum((resultSim.totalDamecon) / totalNum / rateSunk);
			
			for (let i=0; i<resultSim.nodes.length; i++) {
				let node = resultSim.nodes[i];
				for (let letter in node.ranks) {
					let key = 'rank'+letter;
					this.results[key+'Node'][i] = formatNum(node.ranks[letter] / node.num);
				}
				this.results.flagSunkNode[i] = formatNum(node.flagsunk / node.num);
				this.results.taiha[i] = formatNum(node.taiha / node.num);
				this.results.noChuuha[i] = formatNum(node.undamaged / node.num);
				for (let num=1; num<=7; num++) {
					this.results['mvp'+num][i] = formatNum(node.mvps[num-1] / node.num);
					this.results['taiha'+num][i] = formatNum(node.taihaIndiv[num-1] / node.num);
				}
				for (let num=1; num<=6; num++) {
					this.results['mvpE'+num][i] = formatNum(node.mvpsC[num-1] / node.num);
					this.results['taihaE'+num][i] = formatNum(node.taihaIndivC[num-1] / node.num);
				}
				this.results.airAI[i] = formatNum(node.airStates[0] / node.num);
				this.results.airAD[i] = formatNum(node.airStates[1] / node.num);
				this.results.airAP[i] = formatNum(node.airStates[2] / node.num);
				this.results.airAS[i] = formatNum(node.airStates[3] / node.num);
				this.results.airASP[i] = formatNum(node.airStates[4] / node.num);
			}
		},
		
		onclickInsertBattle: function(ind) {
			this.addNewBattle(ind);
		},
		onchangeLang: function() {
			localStorage.sim2_lang = this.$i18n.locale;
		},
		
		onchangeMechanic: function(mechanic) {
			if (mechanic.key == 'eqBonus') {
				COMMON.global.fleetEditorToggleEquipBonus(mechanic.enabled);
			}
		},
		
		callbackSimStats: function(res) {
			if (res.errors) {
				this.results.errors = res.errors.filter(obj => this.results.isFromImport || !obj.excludeClient).map(obj => obj.txt);
				this.canSim = true;
				return;
			}
			if (res.warnings) {
				this.results.warnings = res.warnings.filter(obj => this.results.isFromImport || !obj.excludeClient).map(obj => obj.txt);
			}
			if (res.didReset) {
				this.results.active = false;
			}
			if (res.progress != null) {
				this.simProgress = Math.round(100*res.progress/res.progressTotal);
			}
			if (res.result) {
				this.results.active = true;
				this.updateResults(res.result);
				this.canSim = true;
				console.log(res.result);
			}
		},
		onclickGo: function() {
			if (!this.canSim) return;
			this.results.errors = [];
			this.numSim = Math.min(this.numSim,CONST.numSimMax);
			this.canSim = false;
			SIM.runStats(CONVERT.uiToSimInput(this),this.callbackSimStats);
			
			this.results.showCFWarning = !!(this.fleetFMain.combined || this.battles.find(battle => +battle.formation == 6 || battle.enemyComps.find(comp => comp.fleet.combined || comp.fleet.formation == 6)));
		},
		onclickWatch: function() {
			if (!this.canSim) return;
			this.results.errors = [];
			let replay = CONVERT.uiToReplay(this);
			let errors = SIM.runReplay(CONVERT.uiToSimInput(this),replay);
			if (errors) {
				this.results.errors = errors;
				return;
			}
			console.log(replay)
			let s = JSON.stringify(replay);
			window.open('battleplayer.html#'+s,'_blank');
		},
		onclickClear: function() {
			if (!this.canSim) return;
			this.results.active = false;
			SIM.resetStats();
		},
		
		onclickDeckbuilder: function() {
			UI_DECKBUILDERIMPORTER.doOpen();
		},
		
		onclickBackup: function() {
			UI_BACKUP.doOpen();
		},
		
		initSimImport: function(dataInput) {
			let style = document.createElement('style');
			style.innerText = '#divMain > *, #divOther { display: none; }';
			document.head.appendChild(style);
			this.canSim = false;
			this.results.isFromImport = true;
			SIM.runStats(dataInput,this.callbackSimStats);
		},
	},
}).component('vbattle',{
	props: ['battle','candelete'],
	data: () => ({
		
	}),
	mounted: function() {
		
	},
	computed: {
		hasNB: function() {
			return this.battle.nodeType == CONST.NODE_NORMAL || this.battle.nodeType == CONST.NODE_AIR;
		},
		battleClass: function() {
			return {
				normal: this.battle.nodeType==CONST.NODE_NORMAL,
				night: this.battle.nodeType==CONST.NODE_NIGHT,
				raid: this.battle.nodeType==CONST.NODE_RAID,
				air: this.battle.nodeType==CONST.NODE_AIR,
			};
		},
		hasCombinedFormations: function() {
			return this.battle.nodeType != CONST.NODE_NIGHT && UI_MAIN.fleetFMain.combined;
		},
	},
	methods: {
		hasBonusMain: function() {
			for (let key of ['ships','shipsEscort']) {
				if (UI_MAIN.fleetFMain[key] && UI_MAIN.fleetFMain[key].find(ship => !FLEET_MODEL.shipIsEmpty(ship) && ship.bonusByNode[this.battle.id] && Object.values(ship.bonusByNode[this.battle.id]).find(v => v))) return true;
			}
			return false;
		},
		hasBonusLBAS: function() {
			return false;
		},
		hasBonusFF: function() {
			return false;
		},
		
		onclickDeleteBattle: function() {
			UI_MAIN.deleteBattle(this.battle.ind,this.$refs.comps);
		},
		onclickSetBonus: function() {
			UI_BONUSEDITOR.doOpen(this.battle.id,this.battle.ind == UI_MAIN.battles.length-1);
		},
	},
	watch: {
		hasCombinedFormations: function() {
			if (this.hasCombinedFormations) {
				if (this.battle.formation < 10) this.battle.formation = CONST.formationCombinedDefault;
			} else {
				if (this.battle.formation > 10) this.battle.formation = CONST.formationSingleDefault;
			}
		},
	},
	template: document.getElementById('tmpBattle')
}).component('vfleetcomps',{
	props: ['comps','fleetname','canimportkcnav','isfriendfleet'],
	data: () => ({
		
	}),
	computed: {
		canAddComp: function() {
			return this.comps.length < CONST.numCompMax;
		},
	},
	methods: {
		getCompName: function(comp) {
			return this.fleetname + ' - Comp ' + comp.num;
		},
		getCompPercent: function(comp) {
			let total = this.comps.reduce((a,b) => a + Math.max(0,b.rate),0);
			if (total <= 0) return Math.round(100/this.comps.length);
			return Math.round(100*Math.max(0,comp.rate)/total);
		},
		
		onclickAddComp: function() {
			UI_MAIN.addNewComp(this.comps);
		},
		onclickRemoveComp: function(battle) {
			UI_MAIN.deleteComp(this.comps,this.$refs['comp'+this.comps.length][0]);
		},
		onclickImportKCNav: function() {
			UI_KCNAVCOMPIMPORTER.doOpen(this.comps,this.isfriendfleet);
		},
	},
	template: document.getElementById('tmpFleetComps')
}).component('vfleet',CMP_FLEET).component('vlbaseditor',CMP_LBASEDITOR).use(COMMON.i18n).mount('#divMain');




var UI_BONUSEDITOR = Vue.createApp({
	data: () => ({
		active: false,
		shipGroups: [],
		nodeId: 0,
		isBossNode: false,
	}),
	methods: {
		doOpen: function(nodeId,isBossNode) {
			this.active = true;
			this.nodeId = nodeId;
			this.isBossNode = isBossNode;
			this.shipGroups = [];
			this.shipGroups.push(UI_MAIN.fleetFMain.ships.filter(ship => !FLEET_MODEL.shipIsEmpty(ship)));
			if (UI_MAIN.fleetFMain.shipsEscort && UI_MAIN.fleetFMain.combined) this.shipGroups.push(UI_MAIN.fleetFMain.shipsEscort.filter(ship => !FLEET_MODEL.shipIsEmpty(ship)));
			for (let ships of this.shipGroups) {
				for (let ship of ships) {
					if (!ship.mstId) continue;
					if (!ship.bonusByNode[nodeId]) ship.bonusByNode[nodeId] = {};
				}
			}
		},
		doClose: function() {
			this.active = false;
		},
	},
}).component('vmodal',COMMON.CMP_MODAL).mount('#divBonusEditor');


var UI_DECKBUILDERIMPORTER = Vue.createApp({
	data: () => ({
		active: false,
		textImport: '',
		textExport: '',
		importMain: true,
		importSupportN: true,
		importSupportB: true,
		importLBAS: true,
		fleetNumMain: '1+2',
		fleetNumSupportN: '3',
		fleetNumSupportB: '4',
	}),
	methods: {
		doOpen: function() {
			this.active = true;
		},
		
		getDataDb: function() {
			let dataDb = CONVERT.saveToDeckbuilderFleet(CONVERT.uiToSaveFleet(UI_MAIN.fleetFMain));
			dataDb.f3 = CONVERT.saveToDeckbuilderFleet(CONVERT.uiToSaveFleet(UI_MAIN.fleetFSupportN)).f1;
			dataDb.f4 = CONVERT.saveToDeckbuilderFleet(CONVERT.uiToSaveFleet(UI_MAIN.fleetFSupportB)).f1;
			if (UI_MAIN.fleetFMain.type == CONST.SF) {
				dataDb.f2 = dataDb.f3;
				dataDb.f3 = dataDb.f1;
			}
			let dataDbLBAS = CONVERT.saveToDeckbuilderLBAS(CONVERT.uiToSaveLBAS(UI_MAIN.landBases));
			for (let key in dataDbLBAS) {
				dataDb[key] = dataDb[key] || dataDbLBAS[key];
			}
			return dataDb;
		},
		loadDataDb: function(dataDb,fleetNum,fleetUI,isSupport) {
			let dataDbN = dataDb;
			if (fleetNum != '1+2') {
				let key = 'f'+fleetNum;
				if (!dataDb[key] || Object.keys(dataDb[key]).length <= 0) return;
				dataDbN = { version: dataDb.version, f1: dataDb[key] };
			}
			if (isSupport) {
				if (fleetNum == '1+2') return;
				if (dataDbN.f1.s7) delete dataDbN.f1.s7;
			}
			CONVERT.loadSaveFleet(CONVERT.deckbuilderToSaveFleet(dataDbN),fleetUI);
		},
		
		onclickImport: function() {
			if (!this.textImport) return;
			let dataDb;
			try {
				dataDb = JSON.parse(this.textImport);
			} catch (e) {
				console.error(e);
				return;
			}
			if (this.importMain) {
				UI_MAIN.fleetFMain = FLEET_MODEL.getBlankFleet(UI_MAIN.fleetFMain);
				this.loadDataDb(dataDb,this.fleetNumMain,UI_MAIN.fleetFMain);
			}
			if (this.importSupportN) {
				UI_MAIN.fleetFSupportN = FLEET_MODEL.getBlankFleet(UI_MAIN.fleetFSupportN);
				this.loadDataDb(dataDb,this.fleetNumSupportN,UI_MAIN.fleetFSupportN,true);
			}
			if (this.importSupportB) {
				UI_MAIN.fleetFSupportB = FLEET_MODEL.getBlankFleet(UI_MAIN.fleetFSupportB);
				this.loadDataDb(dataDb,this.fleetNumSupportB,UI_MAIN.fleetFSupportB,true);
			}
			if (this.importLBAS) {
				CONVERT.loadSaveLBAS(CONVERT.deckbuilderToSaveLBAS(dataDb),UI_MAIN.landBases);
			}
			COMMON.global.fleetEditorMoveTemp();
		},
		onclickExport: function() {
			let dataDb = this.getDataDb();
			this.textExport = JSON.stringify(dataDb);
			setTimeout(() => this.$refs.textExport.select());
		},
		onclickOpenDb: function() {
			let dataDb = this.getDataDb();
			window.open(CONST.urlDeckbuilder + encodeURI(JSON.stringify(dataDb)));
		},
	},
}).component('vmodal',COMMON.CMP_MODAL).mount('#divDeckbuilderImporter');


var UI_KCNAVCOMPIMPORTER = Vue.createApp({
	data: () => ({
		active: false,
		canClose: true,
		showNoData: false,
		showError: false,
		showTimeout: false,
		txtLoading: '',
		comps: null,
		isFriendFleet: false,
		
		world: null,
		mapnum: null,
		edges: null,
		gaugeNum: null,
		gaugeHPMin: null,
		gaugeHPMax: null,
		diff: 0,
		hqMin: null,
		hqMax: null,
		ffSkipSame: true,
		ffStrong: true,
		
		selectWorld: 0,
		selectLetter: 0,
		optionsWorld: [],
		optionsLetter: [],
	}),
	mounted: function() {
		let keys = [1,2,3,7,4,5,6].concat(Object.keys(MAPDATA).filter(id => +id > 7 && +id >= CONST.kcnavEventFirst).sort((a,b) => +a-+b));
		for (let id of keys) {
			this.optionsWorld.push({ id: +id, name: MAPDATA[id].name.replace('Event ','') });
		}
	},
	methods: {
		doOpen: function(compUI,isFriendFleet) {
			this.active = true;
			this.canClose = true;
			this.showNoData = this.showError = this.showTimeout = false;
			this.comps = compUI;
			this.isFriendFleet = !!isFriendFleet;
		},
		
		onchangeWorldMap: function() {
			this.optionsLetter = [];
			let key = 'World ' + this.world + '-' + this.mapnum;
			if (!EDGES[key]) return;
			let letterToEdges = {};
			for (let edgeId in EDGES[key]) {
				let letter = EDGES[key][edgeId][1];
				if (letter.indexOf('Start') == 0) continue;
				if (!letterToEdges[letter]) letterToEdges[letter] = [];
				letterToEdges[letter].push(edgeId);
			}
			for (let letter of Object.keys(letterToEdges).sort()) {
				this.optionsLetter.push({ letter: letter, edges: letterToEdges[letter].join(',') });
			}
		},
		onchangeSelectWorld: function() {
			if (this.selectWorld) {
				this.world = this.selectWorld;
				this.onchangeWorldMap();
			}
			this.selectWorld = 0;
		},
		onchangeSelectLetter: function() {
			if (this.selectLetter) {
				this.edges = this.selectLetter;
			}
			this.selectLetter = 0;
		},
		
		onclickLoad: function() {
			this.showNoData = this.showError = this.showTimeout = false;
			if (!this.world) {
				this.$refs.inputWorld.focus();
				return;
			}
			if (!this.mapnum) {
				this.$refs.inputMapnum.focus();
				return;
			}
			if (!this.edges || !this.edges.match(/^[0-9,]+$/g)) {
				this.$refs.inputEdges.focus();
				return;
			}
			this.canClose = false;
			
			let url = this.isFriendFleet ? CONST.urlKCNavFriendFleets : CONST.urlKCNavEnemyComps;
			url += '?map=' + this.world + '-' + this.mapnum;
			url += '&edges=' + this.edges;
			if (!this.isFriendFleet) {
				url += '&minGaugeLevel=' + (this.gaugeHPMin != null ? this.gaugeHPMin : 0);
				url += '&maxGaugeLevel=' + (this.gaugeHPMax != null ? this.gaugeHPMax : 99999);
				url += '&minGauge=' + (this.gaugeNum || 1);
				url += '&maxGauge=' + (this.gaugeNum || 4);
				if (this.diff && +this.world > 10) {
					url += '&minDiff=' + this.diff + '&maxDiff=' + this.diff;
				}
				if (this.hqMin) url += '&minHqLvl=' + this.hqMin;
				if (this.hqMax) url += '&maxHqLvl=' + this.hqMax;
			} else {
				url += '&minGauge=1&maxGauge=4';
			}
			if (+this.world < 10) {
				url += '&start=' + CONST.kcnavDateStart;
			}
			// if (+this.world < 10) {
				// let d = new Date();
				// d.setDate(d.getDate() - CONST.kcnavDaysMax);
				// url += '&start=' + d.toISOString().split('T')[0];
			// }
			console.log(url);
			
			this.txtLoading = ' ???';
			this.updateLoading();
			
			let xhr = new XMLHttpRequest();
			xhr.open('GET',url);
			xhr.onload = function() {
				this.txtLoading = '';
				this.canClose = true;
				if (xhr.status >= 500 && xhr.status < 600) {
					this.showTimeout = true;
					return;
				}
				let compsNav = JSON.parse(xhr.response);
				console.log(compsNav);
				if (!compsNav.entries || compsNav.entries.length <= 0) {
					this.showNoData = true;
					return;
				}
				COMMON.global.fleetEditorMoveTemp();
				if (this.isFriendFleet) {
					compsNav.entries = compsNav.entries.filter(entry => !!entry.requestType == !!this.ffStrong);
					if (this.ffSkipSame) {
						let idsMain = UI_MAIN.fleetFMain.ships.filter(ship => !FLEET_MODEL.shipIsEmpty(ship)).map(ship => ship.mstId);
						if (UI_MAIN.fleetFMain.combined) idsMain = idsMain.concat(UI_MAIN.fleetFMain.shipsEscort.filter(ship => !FLEET_MODEL.shipIsEmpty(ship)).map(ship => ship.mstId));
						let idsAll = {};
						for (let idMain of idsMain) {
							let id = window.getBaseId(idMain);
							do {
								idsAll[id] = 1;
								id = SHIPDATA[id].next;
							} while (id && !idsAll[id]);
						}
						compsNav.entries = compsNav.entries.filter(entry => !entry.fleet.map(ship => ship.id).find(id => idsAll[id]));
					}
				}
				let compsSave = CONVERT.kcnavToSaveComps(compsNav);
				compsSave.sort((a,b) => b.rate - a.rate);
				for (let i=this.comps.length; i>compsSave.length; i--) UI_MAIN.deleteComp(this.comps);
				for (let comp of this.comps) comp.fleet = FLEET_MODEL.getBlankFleet(comp.fleet);
				for (let i=this.comps.length; i<compsSave.length; i++) UI_MAIN.addNewComp(this.comps);
				CONVERT.loadSaveComps(compsSave,this.comps);
				this.active = false;
			}.bind(this);
			xhr.onerror = function() {
				this.txtLoading = '';
				this.canClose = true;
				this.showError = true;
			}.bind(this);
			xhr.send();
		},
		
		updateLoading: function() {
			setTimeout(function() {
				if (!this.txtLoading) return;
				this.txtLoading += ' ???';
				if (this.txtLoading.length > 6) this.txtLoading = ' ???';
				this.updateLoading();
			}.bind(this),500);
		},
	},
}).component('vmodal',COMMON.CMP_MODAL).mount('#divKCNavCompImporter');


var UI_BACKUP = Vue.createApp({
	data: () => ({
		active: false,
		canClose: true,
		isReplayImport: false,
		confirmReset: false,
		showImportError: false,
		
		callback: null,
	}),
	methods: {
		doOpen: function(callbackReplayImport) {
			this.active = true;
			this.confirmReset = false;
			this.showImportError = false;
			this.isReplayImport = false;
			this.canClose = true;
			if (callbackReplayImport) {
				this.isReplayImport = true;
				this.canClose = false;
				this.callback = callbackReplayImport;
			}
		},
		
		onclickDownload: function() {
			let save = { data: JSON.stringify(CONVERT.uiToSave(UI_MAIN)), source: CONST.simSaveKey };
			
			let filename = 'KanColle_Sortie_Simulator_Backup_' + (new Date).toISOString().slice(0,10) + '.kcsim';

			let a = window.document.createElement('a');
			a.href = window.URL.createObjectURL(new Blob([LZString.compressToBase64(JSON.stringify(save))], {type: 'application/json'}));
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		},
		
		onchangeFileBackup: function(e) {
			if (!e.target.files.length) return;
			let reader = new FileReader();
			reader.readAsText(e.target.files[0]);
			reader.addEventListener('loadend',() => CONVERT.setSimBackupFile(reader));
			this.showImportError = false;
		},
		
		onclickImportAll: function() {
			UI_MAIN.canSave = false;
			let save = CONVERT.getSimBackupFile();
			if (!save || !save.data) {
				this.showImportError = true;
				return;
			}
			localStorage.sim2 = save.data;
			window.location.reload();
		},
		
		onclickImportPlayer: function() {
			let save = CONVERT.getSimBackupFile();
			if (!save || !save.data) {
				this.showImportError = true;
				return;
			}
			let dataSave = JSON.parse(save.data);
			for (let key of ['fleetFMain','fleetFSupportN','fleetFSupportB']) {
				if (!dataSave[key]) continue;
				UI_MAIN[key] = FLEET_MODEL.getBlankFleet(UI_MAIN[key]);
				CONVERT.loadSaveFleet(dataSave[key],UI_MAIN[key]);
			}
			if (dataSave.landBases) {
				CONVERT.loadSaveLBAS(dataSave.landBases,UI_MAIN.landBases);
			}
			COMMON.global.fleetEditorMoveTemp();
		},
		
		onclickContinue: function() {
			this.canClose = true;
			this.active = false;
			this.callback();
		},
		
		onclickResetAll: function() {
			if (!this.confirmReset) return;
			UI_MAIN.canSave = false;
			localStorage.sim2 = '';
			window.location.reload();
		},
	},
}).component('vmodal',COMMON.CMP_MODAL).mount('#divSimBackup');;


document.body.onunload = function() {
	if (UI_MAIN.canSave) {
		localStorage.sim2 = JSON.stringify(CONVERT.uiToSave(UI_MAIN));
	}
}

COMMON.UI_MAIN = UI_MAIN; //debug

})();