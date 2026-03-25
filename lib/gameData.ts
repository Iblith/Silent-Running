// lib/gameData.ts — all game constants extracted from app/page.tsx

export const CHAR_COLORS = ['#2E86C1','#1E8449','#C0392B','#6C3483','#D4AC0D','#E67E22','#17A589']

export const SKILL_CHAR: Record<string,string> = {
  'Astrogation':'Int','Athletics':'Br','Brawl':'Br','Charm':'Pr','Coercion':'Wi',
  'Computers':'Int','Cool':'Pr','Coordination':'Ag','Deception':'Cu','Discipline':'Wi',
  'Gunnery':'Ag','Leadership':'Pr','Lightsaber':'Br','Mechanics':'Int','Medicine':'Int','Melee':'Br',
  'Perception':'Cu','Piloting (Planetary)':'Ag','Piloting (Space)':'Ag',
  'Ranged (Heavy)':'Ag','Ranged (Light)':'Ag','Resilience':'Br','Skulduggery':'Cu',
  'Stealth':'Ag','Streetwise':'Cu','Survival':'Cu','Vigilance':'Wi',
}

export const CHAR_ABBR_CYCLE = ['Br','Ag','Int','Cu','Wi','Pr']

export const CHAR_ABBR: Record<string,string> = {
  Brawn:'Br',Agility:'Ag',Intellect:'Int',Cunning:'Cu',Willpower:'Wi',Presence:'Pr'
}
export const CHAR_KEYS = ['Brawn','Agility','Intellect','Cunning','Willpower','Presence']

export const DEFAULT_SKILLS = Object.fromEntries(Object.keys(SKILL_CHAR).map(k=>[k,0]))

export const DEFAULT_CHAR = {
  id:'', name:'New Character', player:'', species:'', career:'', specialisation:'',
  colorIdx:0,
  characteristics:{Brawn:2,Agility:2,Intellect:2,Cunning:2,Willpower:2,Presence:2},
  wounds:0, woundThreshold:12, strain:0, strainThreshold:12,
  soak:2, defenseMelee:0, defenseRanged:0, forceRating:0, duty:0, dutyType:'', morality:50,
  skills:{...Object.fromEntries(Object.keys(SKILL_CHAR).map(k=>[k,0]))},
  talents:[] as any[], weapons:[] as any[], equipment:[] as any[], inventory:[] as any[],
  notes:'', xp:0, totalXp:0,
}

export const INITIAL_CAMPAIGN = {
  session:1, heatLevel:0, renausTrack:0, mercyCount:0, expedCount:0,
  ht:0, sst:0, stealthActive:false,
  missionStatus:{} as Record<string,string>,
  shipUpgrades:{} as Record<string,boolean>,
  gmNotes:'',
  duty:0, tier:1,
  crewCriticals:[] as any[],
  shipCriticals:[] as any[],
  campaignName:'Operation: Silent Running',
}

export const MISSIONS = [
  {id:'m11',name:'1-1  Dark Cargo',         act:'I',  duty:'5+',  sessions:1},
  {id:'m12',name:'1-2  Ghost Light',         act:'I',  duty:'8',   sessions:1},
  {id:'m13',name:'1-3  Cold Extraction',     act:'I',  duty:'10+', sessions:2},
  {id:'m21',name:'2-1  The Hammer Falls',    act:'II', duty:'15+', sessions:2},
  {id:'m22',name:'2-2  Deep Water',          act:'II', duty:'12+', sessions:2},
  {id:'m23',name:'2-3  Signal in the Dark',  act:'II', duty:'20',  sessions:1},
  {id:'m3f',name:'3-F  Installation Omega',  act:'III',duty:'50',  sessions:4},
]

export const SHIP_UPGRADES = [
  {id:'cool1', name:'Improved Cooling',       cost:5,  branch:'A'},
  {id:'mask1', name:'Sensor Mask',            cost:10, branch:'A'},
  {id:'ext1',  name:'Extended Crystal Array', cost:10, branch:'A'},
  {id:'ecm1',  name:'Passive ECM Suite',      cost:15, branch:'A'},
  {id:'ghost1',name:'Sensor Ghost Emitters',  cost:20, branch:'A'},
  {id:'sfire1',name:'Silent Firing Mode',     cost:20, branch:'A'},
  {id:'cloak1',name:'Full Spectrum Cloak',    cost:30, branch:'A'},
  {id:'ion1',  name:'Ion Cannon (Forward)',   cost:10, branch:'B'},
  {id:'pdf1',  name:'Point Defence Network',  cost:10, branch:'B'},
  {id:'hull1', name:'Reinforced Hull Plating',cost:15, branch:'B'},
  {id:'turbo1',name:'Dorsal Turbolaser',      cost:20, branch:'B'},
  {id:'cap1',  name:'Capital-Class Shields',  cost:30, branch:'B'},
  {id:'jump1', name:'Emergency Jump Caps.',   cost:20, branch:'E'},
  {id:'hyper1',name:'Hyperdrive ×0.5',        cost:10, branch:'E'},
  {id:'han1',  name:'Basic Hangar Bay (1)',   cost:15, branch:'F'},
  {id:'han2',  name:'Expanded Hangar (2)',    cost:15, branch:'F'},
  {id:'han3',  name:'Full Wing Bay (4)',       cost:20, branch:'F'},
  {id:'stealth_han',name:'Stealth Hangar Shielding',cost:10,branch:'F'},
]

export const CREW_CRIT: {lo:number,hi:number,sev:number,name:string,eff:string}[] = [
  {lo:1,  hi:5,  sev:1,name:'Minor Nick',          eff:'1 strain'},
  {lo:6,  hi:10, sev:1,name:'Slowed',               eff:'Can only act during last allied initiative slot on next turn'},
  {lo:11, hi:15, sev:1,name:'Sudden Jolt',          eff:'Drop item in hand'},
  {lo:16, hi:20, sev:1,name:'Distracted',           eff:'Cannot perform free maneuver next turn'},
  {lo:21, hi:25, sev:1,name:'Off-Balance',          eff:'+boost to next skill check'},
  {lo:26, hi:30, sev:1,name:'Discouraging Wound',   eff:'Flip light side Destiny Point to dark side (reverse for NPC)'},
  {lo:31, hi:35, sev:1,name:'Stunned',              eff:'Staggered until end of next turn'},
  {lo:36, hi:40, sev:1,name:'Stinger',              eff:'+setback to next check'},
  {lo:41, hi:45, sev:2,name:'Bowled Over',          eff:'Knocked prone, +1 strain'},
  {lo:46, hi:50, sev:2,name:'Head Ringer',          eff:'+setback to Intellect/Cunning checks until end of encounter'},
  {lo:51, hi:55, sev:2,name:'Fearsome Wound',       eff:'+setback to Presence/Willpower checks until end of encounter'},
  {lo:56, hi:60, sev:2,name:'Agonizing Wound',      eff:'+setback to Brawn/Agility checks until end of encounter'},
  {lo:61, hi:65, sev:2,name:'Slightly Dazed',       eff:'Disoriented until end of encounter'},
  {lo:66, hi:70, sev:2,name:'Scattered Senses',     eff:'Gains no boost dice until end of encounter'},
  {lo:71, hi:75, sev:2,name:'Hamstrung',            eff:'Lose free maneuver until end of encounter'},
  {lo:76, hi:80, sev:2,name:'Overpowered',          eff:'Attacker may immediately attempt another free attack with same pool'},
  {lo:81, hi:85, sev:2,name:'Winded',               eff:'Cannot voluntarily suffer strain until end of encounter'},
  {lo:86, hi:90, sev:2,name:'Compromised',          eff:'+setback until end of encounter'},
  {lo:91, hi:95, sev:3,name:'At the Brink',         eff:'Suffer 1 strain per action until healed'},
  {lo:96, hi:100,sev:3,name:'Crippled',             eff:'One limb impaired until healed/replaced. +setback to all checks using that limb'},
  {lo:101,hi:105,sev:3,name:'Maimed',               eff:'One limb permanently lost. Cannot use limb for actions. All other actions +boost'},
  {lo:106,hi:110,sev:3,name:'Horrific Injury',      eff:'-1 penalty to random characteristic until healed (1–3 Br, 4–6 Ag, 7 Int, 8 Cu, 9 Pr, 10 Wi)'},
  {lo:111,hi:115,sev:3,name:'Temporarily Lame',     eff:'Cannot perform more than 1 maneuver per turn until healed'},
  {lo:116,hi:120,sev:3,name:'Blinded',              eff:'Cannot see. +2 setback to all checks. +3 setback to Perception and Vigilance'},
  {lo:121,hi:125,sev:3,name:'Knocked Senseless',    eff:'Staggered until end of encounter'},
  {lo:126,hi:130,sev:4,name:'Gruesome Injury',      eff:'Permanent -1 to random characteristic (1–3 Br, 4–6 Ag, 7 Int, 8 Cu, 9 Pr, 10 Wi)'},
  {lo:131,hi:140,sev:4,name:'Bleeding Out',         eff:'Suffer 1 wound and 1 strain per turn. +1 Critical per 5 wounds beyond threshold'},
  {lo:141,hi:150,sev:4,name:'The End is Nigh',      eff:'Character dies after last Initiative slot of next round'},
  {lo:151,hi:999,sev:5,name:'Dead',                 eff:'Character is dead'},
]

export const SHIP_CRIT: {lo:number,hi:number,sev:number,name:string,eff:string}[] = [
  {lo:1,  hi:9,  sev:1,name:'Mechanical Stress',      eff:'+1 system strain'},
  {lo:10, hi:18, sev:1,name:'Jostled',                eff:'Small explosion. Crew suffer +1 strain and are disoriented for 1 round'},
  {lo:19, hi:27, sev:1,name:'Losing Power to Shields',eff:'-1 defense in a defense zone until repaired. If no defense, -1 strain'},
  {lo:28, hi:36, sev:1,name:'Knocked Off Course',     eff:'Next turn: pilot cannot execute maneuvers, must make Piloting check (difficulty = speed)'},
  {lo:37, hi:45, sev:1,name:'Tailspin',               eff:'All ship attacks +2 setback and all crew immobilized until end of pilot\'s next turn'},
  {lo:46, hi:54, sev:1,name:'Component Hit',          eff:'One component inoperable until end of next round'},
  {lo:55, hi:63, sev:2,name:'Shields Failing',        eff:'-1 defense in all zones until repaired. If no defense, -2 system strain'},
  {lo:64, hi:72, sev:2,name:'Navicomputer Failure',   eff:'Navicomputer (or astromech) fails until repaired. Navigation systems fly blind'},
  {lo:73, hi:81, sev:2,name:'Power Fluctuations',     eff:'Pilot cannot voluntarily inflict system strain until repaired'},
  {lo:82, hi:90, sev:3,name:'Shields Down',           eff:'Defense in affected zone = 0, -1 defense in all other zones until repaired. If no defense, -4 system strain'},
  {lo:91, hi:99, sev:3,name:'Engine Damaged',         eff:'-1 speed (minimum 1) until repaired'},
  {lo:100,hi:108,sev:3,name:'Shield Overload',        eff:'-2 system strain. Defense = 0 in all zones. Cannot repair until end of encounter. If no defense, -1 armor'},
  {lo:109,hi:117,sev:3,name:'Engines Down',           eff:'Speed = 0. Cannot perform maneuvers until repaired. Continues on present course due to momentum'},
  {lo:118,hi:126,sev:3,name:'Major System Failure',   eff:'One randomly chosen component inoperable until repaired'},
  {lo:127,hi:133,sev:4,name:'Major Hull Breach',      eff:'Silhouette 4+: depressurize in rounds equal to silhouette. Partially depressurized at GM\'s discretion'},
  {lo:134,hi:138,sev:4,name:'Destabilized',           eff:'Hull Trauma Threshold and System Strain Threshold reduced to ½ original values until repaired'},
  {lo:139,hi:144,sev:4,name:'Fire!',                  eff:'-2 system strain. Crew may be caught in fire. Takes 1 round per 2 silhouette to extinguish (Cool + Vigilance checks)'},
  {lo:145,hi:153,sev:4,name:'Breaking Up',            eff:'Ship completely destroyed at end of next round'},
  {lo:154,hi:999,sev:5,name:'Vaporized',              eff:'Ship destroyed in an impressive fireball. Nothing survives'},
]

export const SHIP_STATS: Record<string,{
  name:string; category:string; manufacturer:string; model:string;
  silhouette:number; speed:number; handling:number;
  defFore:number; defAft:number; armour:number;
  hullTrauma:number; systemStrain:number;
  weapons:{name:string;fire:string;damage:number;critical:number;range:string;qualities:string}[];
  abilities:string[]; complement:string; consumables:string; hyperdrive:string; desc:string;
}> = {
  phantom_tide:{
    name:'Phantom Tide',category:'PLAYER SHIP',manufacturer:"Modified Corellian Engineering Corp",model:'YT-2400 Light Freighter (heavily modified)',
    silhouette:3,speed:4,handling:2,defFore:2,defAft:1,armour:3,hullTrauma:18,systemStrain:14,
    weapons:[
      {name:'Dorsal Laser Cannon Turret',fire:'1',damage:6,critical:3,range:'Close',qualities:'Accurate 1'},
      {name:'Forward Concussion Missile Launcher',fire:'1',damage:6,critical:3,range:'Short',qualities:'Blast 4, Breach 4, Guided 3, Slow-Firing 1, Limited Ammo 6'},
    ],
    abilities:['Sensor Mask (passive): add 2 setback to all checks to detect the Phantom Tide on sensors','Stealth Drive (active): reduce effective silhouette by 1; cannot fire weapons while active','Modular Hardpoints: crew may swap weapon/upgrade loadout at a port (1 downtime action)'],
    complement:'Crew 4, Passengers 6',consumables:'2 months',hyperdrive:'Primary ×1, Backup ×12',
    desc:'The crew\'s ship. A battered YT-2400 whose original hull plates have been replaced so many times she\'s practically a new vessel. She is fast, quiet, and fiercely loyal to anyone who keeps her running.',
  },
  isd:{
    name:'ISD Hammer of Patience',category:'CAPITAL SHIP',manufacturer:'Kuat Drive Yards',model:'Imperial-class Star Destroyer (Mark I)',
    silhouette:8,speed:2,handling:-3,defFore:4,defAft:2,armour:9,hullTrauma:120,systemStrain:80,
    weapons:[
      {name:'Heavy Turbolaser Batteries (×60)',fire:'5',damage:13,critical:3,range:'Long',qualities:'Breach 4, Slow-Firing 1'},
      {name:'Turbolaser Batteries (×60)',fire:'5',damage:10,critical:3,range:'Medium',qualities:'Breach 3'},
      {name:'Ion Cannon Batteries (×10)',fire:'3',damage:7,critical:4,range:'Medium',qualities:'Ion'},
      {name:'Tractor Beam Projectors (×10)',fire:'3',damage:0,critical:0,range:'Short',qualities:'Tractor 6'},
      {name:'Concussion Missile Tubes (×6)',fire:'1',damage:6,critical:3,range:'Short',qualities:'Blast 4, Breach 4, Guided 3, Slow-Firing 1, Limited Ammo 36'},
    ],
    abilities:['Overwhelming Firepower: once per round, may fire one additional weapon system as an incidental','Flagship: all Imperial forces within close range add 1 boost to combat and discipline checks'],
    complement:'Crew 37,085; Troops 9,700; Starfighters 72',consumables:'6 years',hyperdrive:'Primary ×2, Backup ×8',
    desc:'Captain Renaus\' command. 1,600 metres of cold Imperial certainty. Wherever she appears, the sky goes dark.',
  },
  vsd:{
    name:'Victory-class Star Destroyer',category:'CAPITAL SHIP',manufacturer:'Rendili StarDrive / Walex Blissex',model:'Victory-class Star Destroyer (Mark II)',
    silhouette:7,speed:3,handling:-2,defFore:3,defAft:2,armour:7,hullTrauma:75,systemStrain:55,
    weapons:[
      {name:'Turbolaser Batteries (×20)',fire:'3',damage:10,critical:3,range:'Medium',qualities:'Breach 3'},
      {name:'Ion Cannon Batteries (×10)',fire:'2',damage:7,critical:4,range:'Medium',qualities:'Ion'},
      {name:'Concussion Missile Tubes (×10)',fire:'2',damage:6,critical:3,range:'Short',qualities:'Blast 4, Breach 4, Guided 3, Slow-Firing 1, Limited Ammo 50'},
    ],
    abilities:['Tactical Flexibility: reduce the difficulty of all Piloting (Space) checks made to perform special maneuvers by 1'],
    complement:'Crew 5,765; Troops 2,040; Starfighters 24',consumables:'4 years',hyperdrive:'Primary ×1, Backup ×6',
    desc:'Older than the ISD but still dangerous in a patrol role. Common sight on sector blockades.',
  },
  gozanti:{
    name:'Gozanti-class Cruiser',category:'PATROL / CORVETTE',manufacturer:'Gallofree Yards / Corellian Engineering Corp',model:'Gozanti-class Assault Carrier',
    silhouette:4,speed:3,handling:0,defFore:1,defAft:1,armour:4,hullTrauma:22,systemStrain:16,
    weapons:[
      {name:'Light Turbolaser Cannons (×2)',fire:'1',damage:9,critical:3,range:'Medium',qualities:'Breach 2, Slow-Firing 1'},
      {name:'Medium Laser Cannons (×2)',fire:'1',damage:6,critical:3,range:'Close',qualities:''},
    ],
    abilities:['Docking Clamps: can carry up to 4 TIE fighters externally; deploy as a maneuver'],
    complement:'Crew 10, Troops 40, 4 docked TIEs',consumables:'3 months',hyperdrive:'Primary ×2, Backup ×12',
    desc:'The Empire\'s workhorse transport and patrol vessel. Usually arrives before the Star Destroyer does.',
  },
  arquitens:{
    name:'Arquitens-class Light Cruiser',category:'PATROL / CORVETTE',manufacturer:'Kuat Drive Yards',model:'Arquitens-class Light Cruiser',
    silhouette:4,speed:4,handling:1,defFore:2,defAft:1,armour:4,hullTrauma:20,systemStrain:14,
    weapons:[
      {name:'Turbolaser Cannons (×4)',fire:'2',damage:10,critical:3,range:'Medium',qualities:'Breach 3, Slow-Firing 1'},
      {name:'Laser Cannon Batteries (×4)',fire:'2',damage:6,critical:3,range:'Close',qualities:''},
      {name:'Concussion Missile Tubes (×2)',fire:'1',damage:6,critical:3,range:'Short',qualities:'Blast 4, Breach 4, Guided 3, Slow-Firing 1, Limited Ammo 12'},
    ],
    abilities:['Fast Response: if this ship acts first in a round, the difficulty of all checks targeting it this round increases by 1'],
    complement:'Crew 700, Troops 100',consumables:'1 year',hyperdrive:'Primary ×1, Backup ×6',
    desc:'Fast and well-armed for its size. Preferred by ISB liaisons and sector patrol commanders.',
  },
  decimator:{
    name:'VT-49 Decimator',category:'PATROL / CORVETTE',manufacturer:'Sienar Fleet Systems',model:'VT-49 Decimator',
    silhouette:4,speed:3,handling:0,defFore:1,defAft:1,armour:4,hullTrauma:18,systemStrain:13,
    weapons:[
      {name:'Heavy Laser Cannons (×2)',fire:'1',damage:6,critical:3,range:'Close',qualities:'Accurate 1'},
      {name:'Concussion Missile Launcher (×1)',fire:'1',damage:6,critical:3,range:'Short',qualities:'Blast 4, Breach 4, Guided 3, Slow-Firing 1, Limited Ammo 6'},
      {name:'Tractor Beam Projector',fire:'1',damage:0,critical:0,range:'Short',qualities:'Tractor 3'},
    ],
    abilities:['Pursuit Drive: once per round, as a maneuver, increase speed by 1 for 1 round (may exceed max speed)'],
    complement:'Crew 7, Troops 6',consumables:'2 months',hyperdrive:'Primary ×2, Backup ×12',
    desc:'Heavy patrol craft used for customs interdiction, prisoner transfer, and high-value pursuits.',
  },
  tie_ln:{
    name:'TIE/ln Space Superiority Starfighter',category:'STARFIGHTER',manufacturer:'Sienar Fleet Systems',model:'Twin Ion Engine Line Fighter',
    silhouette:3,speed:4,handling:3,defFore:0,defAft:0,armour:2,hullTrauma:6,systemStrain:5,
    weapons:[
      {name:'Twin Light Laser Cannons',fire:'1',damage:5,critical:3,range:'Close',qualities:'Linked 1'},
    ],
    abilities:['No Shields: treat any hit that deals damage as a Critical Hit in addition to normal damage','Expendable: Imperial commanders may order TIE formations without counting casualties for Morale'],
    complement:'1 pilot',consumables:'2 days',hyperdrive:'None',
    desc:'Cheap, fast, and everywhere. Lacks shields and life support redundancy. Death is the acceptable trade-off.',
  },
  tie_in:{
    name:'TIE/IN Interceptor',category:'STARFIGHTER',manufacturer:'Sienar Fleet Systems',model:'Twin Ion Engine Interceptor',
    silhouette:3,speed:5,handling:4,defFore:0,defAft:0,armour:2,hullTrauma:7,systemStrain:6,
    weapons:[
      {name:'Quad Laser Cannons',fire:'1',damage:5,critical:3,range:'Close',qualities:'Linked 3, Accurate 1'},
    ],
    abilities:['No Shields: same as TIE/ln','Precision Strike: when performing an aim maneuver, may reroll one attack die'],
    complement:'1 pilot',consumables:'2 days',hyperdrive:'None',
    desc:'Assigned only to elite squadrons. Faster than an X-wing and terrifyingly well-armed for its class.',
  },
  tie_bomber:{
    name:'TIE/sa Bomber',category:'BOMBER',manufacturer:'Sienar Fleet Systems',model:'Twin Ion Engine Bombing Fighter',
    silhouette:3,speed:3,handling:1,defFore:0,defAft:0,armour:3,hullTrauma:8,systemStrain:7,
    weapons:[
      {name:'Twin Light Laser Cannons',fire:'1',damage:5,critical:3,range:'Close',qualities:'Linked 1'},
      {name:'Proton Torpedo Launcher',fire:'1',damage:8,critical:2,range:'Short',qualities:'Blast 6, Breach 6, Guided 2, Slow-Firing 1, Limited Ammo 6'},
      {name:'Concussion Bomb Bay',fire:'1',damage:6,critical:3,range:'Engaged',qualities:'Blast 8, Breach 2, Slow-Firing 2, Limited Ammo 4'},
    ],
    abilities:['Precision Bombing: when targeting large vessels (silhouette 4+), may choose which hit location is affected'],
    complement:'1 pilot',consumables:'2 days',hyperdrive:'None',
    desc:'Slow but brutal against capital ships and installations. The bomber they send when they want something dead.',
  },
  lambda:{
    name:'Lambda-class T-4a Shuttle',category:'TRANSPORT',manufacturer:'Sienar Fleet Systems',model:'Lambda-class T-4a Shuttle',
    silhouette:4,speed:3,handling:0,defFore:2,defAft:1,armour:4,hullTrauma:16,systemStrain:12,
    weapons:[
      {name:'Forward Laser Cannons (×2)',fire:'1',damage:6,critical:3,range:'Close',qualities:'Linked 1'},
      {name:'Dorsal Laser Cannons (×2)',fire:'1',damage:6,critical:3,range:'Close',qualities:'Linked 1'},
      {name:'Retractable Belly Laser Cannon',fire:'1',damage:6,critical:3,range:'Close',qualities:''},
    ],
    abilities:['Priority Clearance: when broadcasting Imperial IFF codes, all Imperial patrol vessels require Hard Deception check to board'],
    complement:'Crew 6, Passengers 20',consumables:'1 month',hyperdrive:'Primary ×1, Backup ×6',
    desc:'The official shuttle of Imperial officers, Moffs, and the Emperor himself. Presence alone is a statement of authority.',
  },
  sentinel:{
    name:'Sentinel-class Landing Craft',category:'TRANSPORT',manufacturer:'Cygnus Spaceworks',model:'Sentinel-class Landing Craft',
    silhouette:4,speed:3,handling:0,defFore:1,defAft:1,armour:4,hullTrauma:18,systemStrain:13,
    weapons:[
      {name:'Laser Cannons (×6)',fire:'2',damage:6,critical:3,range:'Close',qualities:''},
      {name:'Ion Cannons (×2)',fire:'1',damage:5,critical:4,range:'Short',qualities:'Ion'},
      {name:'Concussion Missile Tubes (×2)',fire:'1',damage:6,critical:3,range:'Short',qualities:'Blast 4, Breach 4, Guided 3, Slow-Firing 1, Limited Ammo 12'},
    ],
    abilities:['Assault Ramp: troops inside may deploy as a free action on the same turn the craft lands'],
    complement:'Crew 5, Troops 75',consumables:'1 month',hyperdrive:'None',
    desc:'Used for planetary assault drops. When one of these sets down, the fight is about to get close and personal.',
  },
  steadfast:{
    name:'MC75 Steadfast Resolve',category:'REBEL VESSEL',manufacturer:'Mon Calamari Shipyards',model:'MC75 Star Cruiser',
    silhouette:7,speed:2,handling:-1,defFore:3,defAft:3,armour:7,hullTrauma:80,systemStrain:60,
    weapons:[
      {name:'Turbolaser Batteries (×20)',fire:'3',damage:10,critical:3,range:'Long',qualities:'Breach 3'},
      {name:'Ion Cannon Batteries (×6)',fire:'2',damage:7,critical:4,range:'Medium',qualities:'Ion'},
      {name:'Proton Torpedo Tubes (×6)',fire:'1',damage:8,critical:2,range:'Short',qualities:'Blast 6, Breach 6, Guided 2, Slow-Firing 1, Limited Ammo 36'},
    ],
    abilities:['Redundant Systems: when this ship would gain system strain, reduce by 1 (minimum 0)','Alliance Command: all Rebel forces within medium range add 1 boost to Discipline checks'],
    complement:'Crew 3,225; Troops 1,200; Starfighters 36',consumables:'2 years',hyperdrive:'Primary ×1, Backup ×6',
    desc:'Haven Alpha. The heart of the Alliance presence in this sector. If she falls, the network falls with her.',
  },
  xwing:{
    name:'T-65B X-wing Starfighter',category:'REBEL VESSEL',manufacturer:'Incom Corporation',model:'T-65B X-wing',
    silhouette:3,speed:4,handling:2,defFore:1,defAft:1,armour:3,hullTrauma:9,systemStrain:8,
    weapons:[
      {name:'Quad Laser Cannons',fire:'1',damage:6,critical:3,range:'Close',qualities:'Linked 3'},
      {name:'Proton Torpedo Launchers (×2)',fire:'1',damage:8,critical:2,range:'Short',qualities:'Blast 6, Breach 6, Guided 2, Slow-Firing 1, Limited Ammo 12'},
    ],
    abilities:['R2 Unit: astromech droid provides 1 automatic advantage on Piloting (Space) checks','Shield Regeneration: at end of each round, recover 1 system strain if no system strain was taken this round'],
    complement:'1 pilot, 1 astromech',consumables:'1 week',hyperdrive:'Primary ×1',
    desc:'The defining starfighter of the Rebellion. Tough, fast, and versatile. Has killed two Death Stars.',
  },
  ywing:{
    name:'BTL-A4 Y-wing Starfighter',category:'REBEL VESSEL',manufacturer:'Koensayr Manufacturing',model:'BTL-A4 Y-wing',
    silhouette:3,speed:3,handling:0,defFore:1,defAft:1,armour:4,hullTrauma:10,systemStrain:9,
    weapons:[
      {name:'Twin Laser Cannons',fire:'1',damage:6,critical:3,range:'Close',qualities:'Linked 1'},
      {name:'Ion Cannon Turret',fire:'1',damage:5,critical:4,range:'Close',qualities:'Ion'},
      {name:'Proton Torpedo Launchers (×2)',fire:'1',damage:8,critical:2,range:'Short',qualities:'Blast 6, Breach 6, Guided 2, Slow-Firing 1, Limited Ammo 8'},
    ],
    abilities:['Heavy Bomber: when targeting silhouette 4+ vessels with torpedoes, upgrade the attack pool once'],
    complement:'1 pilot, 1 optional astromech',consumables:'1 week',hyperdrive:'Primary ×1',
    desc:'Old, battered, and irreplaceable. The workhorse of every Rebel strike package.',
  },
  awing:{
    name:'RZ-1 A-wing Interceptor',category:'REBEL VESSEL',manufacturer:'Kuat Systems Engineering',model:'RZ-1 A-wing',
    silhouette:2,speed:5,handling:4,defFore:1,defAft:1,armour:2,hullTrauma:6,systemStrain:7,
    weapons:[
      {name:'Twin Laser Cannons',fire:'1',damage:5,critical:3,range:'Close',qualities:'Linked 1'},
      {name:'Concussion Missile Launcher',fire:'1',damage:6,critical:3,range:'Short',qualities:'Blast 4, Breach 4, Guided 3, Slow-Firing 1, Limited Ammo 6'},
    ],
    abilities:['Sensor Jamming: as a maneuver, pilot may activate sensor jammer; all attacks against this ship from beyond close range add 2 setback until next turn'],
    complement:'1 pilot',consumables:'1 week',hyperdrive:'Primary ×1',
    desc:'Faster than anything the Empire fields. Built for interception, not dogfighting — though pilots rarely make the distinction.',
  },
  uwing:{
    name:'UT-60D U-wing Starfighter/Support Craft',category:'REBEL VESSEL',manufacturer:'Incom Corporation',model:'UT-60D U-wing',
    silhouette:3,speed:3,handling:1,defFore:1,defAft:1,armour:3,hullTrauma:12,systemStrain:10,
    weapons:[
      {name:'Forward Laser Cannons (×2)',fire:'1',damage:6,critical:3,range:'Close',qualities:'Linked 1'},
    ],
    abilities:['Troop Transport: can carry 8 soldiers and deploy them in a single round via side doors','Suppression Run: when performing a strafing maneuver, all troops disembarking this round add 1 boost to their first check'],
    complement:'2 crew, 8 troops',consumables:'3 weeks',hyperdrive:'Primary ×1',
    desc:'The Alliance\'s troop taxi. Lands in places X-wings can\'t. Gets people home who wouldn\'t otherwise make it.',
  },
  laat:{
    name:'LAAT/i Gunship',category:'ASSAULT GUNSHIP',manufacturer:'Rothana Heavy Engineering',model:'Low Altitude Assault Transport/infantry',
    silhouette:3,speed:3,handling:1,defFore:1,defAft:1,armour:4,hullTrauma:14,systemStrain:11,
    weapons:[
      {name:'Laser Cannon Pods (×4)',fire:'2',damage:6,critical:3,range:'Close',qualities:'Linked 1'},
      {name:'Concussion Missile Launchers (×2)',fire:'1',damage:6,critical:3,range:'Short',qualities:'Blast 4, Breach 4, Guided 3, Slow-Firing 1, Limited Ammo 8'},
      {name:'Antipersonnel Blasters (×2)',fire:'1',damage:6,critical:3,range:'Engaged',qualities:'Autofire'},
    ],
    abilities:['Close Air Support: when allied ground troops are in the same zone, add 1 boost to their combat checks','Rapid Deploy: troops may disembark and act on the same round'],
    complement:'2 crew, 30 troops',consumables:'2 weeks',hyperdrive:'None',
    desc:'Clone Wars surplus. Still deadly. Beloved by insurgents and resistance fighters who can keep them running.',
  },
  null_wage:{
    name:'Null Wage',category:'CIVILIAN / NEUTRAL',manufacturer:'Modified Corellian Engineering Corp',model:'Modified CR90 Corvette (criminal refit)',
    silhouette:5,speed:4,handling:1,defFore:2,defAft:1,armour:5,hullTrauma:28,systemStrain:20,
    weapons:[
      {name:'Turbolaser Cannons (×4)',fire:'2',damage:9,critical:3,range:'Medium',qualities:'Breach 2, Slow-Firing 1'},
      {name:'Laser Cannon Batteries (×4)',fire:'2',damage:6,critical:3,range:'Close',qualities:''},
    ],
    abilities:['Smuggler\'s Compartments: add 2 setback to all checks to find hidden cargo','Criminal IFF: can spoof Imperial, Rebel, or independent transponder codes once per session'],
    complement:'Crew 30, Passengers 30',consumables:'6 months',hyperdrive:'Primary ×1, Backup ×6',
    desc:'Drax Solenne\'s command. A CR90 with the Alliance markings cut off and something far more dangerous welded on.',
  },
  yt1300:{
    name:'YT-1300 Light Freighter (generic)',category:'CIVILIAN / NEUTRAL',manufacturer:'Corellian Engineering Corp',model:'YT-1300 Light Freighter',
    silhouette:3,speed:3,handling:1,defFore:1,defAft:0,armour:3,hullTrauma:14,systemStrain:11,
    weapons:[
      {name:'Laser Cannon Turret',fire:'1',damage:6,critical:3,range:'Close',qualities:''},
    ],
    abilities:['Reliable: once per session, if this ship would be disabled, reduce incoming Hull Trauma by 2 instead'],
    complement:'Crew 2, Passengers 6',consumables:'2 months',hyperdrive:'Primary ×2, Backup ×12',
    desc:'The most common light freighter in the galaxy. Half the crew in the Outer Rim started their careers on one of these.',
  },
}

export const SHIP_CATEGORIES = ['ALL','PLAYER SHIP','CAPITAL SHIP','PATROL / CORVETTE','STARFIGHTER','BOMBER','ASSAULT GUNSHIP','TRANSPORT','REBEL VESSEL','CIVILIAN / NEUTRAL']

export const LOCATIONS = [
  {id:'base',    name:"Kal'Shara Station",       type:'home',    x:170,y:420,ly:null,   threat:'Minimal',              desc:"The Phantom Tide's mobile base. Decommissioned ore platform. Hidden."},
  {id:'alpha',   name:'Haven Alpha',             type:'command', x:285,y:480,ly:22,     threat:'Hidden — Heat ≤ 3',    desc:'Mon Calamari cruiser Steadfast Resolve. Alliance command post.'},
  {id:'beta',    name:'Haven Beta',              type:'command', x:228,y:536,ly:55,     threat:'Unknown to Empire',    desc:'Fallback command node. Sullust tunnel network.'},
  {id:'ryloth',  name:'Ryloth',                  type:'rebel',   x:318,y:355,ly:38,     threat:'Moderate garrison',    desc:'Cell WRAITH. Mission 1-1 delivery point.'},
  {id:'sullust', name:'Sullust',                 type:'rebel',   x:248,y:505,ly:51,     threat:'Imperial blockade',    desc:'Volcanic world. SoroSuub workers.'},
  {id:'typhojem',name:'Typhojem Station',        type:'imperial',x:448,y:238,ly:98,     threat:'Medium — 40 personnel',desc:'Customs waystation. Lt. Osk. Bio-scanner. Mission 1-1 checkpoint.'},
  {id:'derrilyn',name:'Derrilyn Station',        type:'imperial',x:590,y:338,ly:119,    threat:'High — TIE patrols',   desc:'KDY fuel depot. 400 workers. Mission 2-1 target.'},
  {id:'kessel',  name:'Kessel',                  type:'imperial',x:110,y:348,ly:22,     threat:'Very high — prison',   desc:'Spice mines. Political prisoners.'},
  {id:'eriadu',  name:'Sector Command: Eriadu',  type:'imperial',x:668,y:452,ly:188,    threat:'Maximum',              desc:'Regional Imperial hub. Grand Moff. ISB HQ.'},
  {id:'corellia',name:'Corellia',                type:'neutral', x:538,y:208,ly:142,    threat:'Heavy Imperial',       desc:'Shadow docks. ISB Sollus. Black market.'},
  {id:'ordmant', name:'Ord Mantell',             type:'neutral', x:408,y:298,ly:67,     threat:'Moderate — bounty',    desc:"Junkyard world. Varro's territory. Mission 1-3 prison break."},
  {id:'naboo',   name:'Naboo',                   type:'neutral', x:528,y:398,ly:88,     threat:'Low garrison',         desc:'Mission 2-2 Tessek assassination. Lira Tessek.'},
  {id:'rodia',   name:'Rodia',                   type:'neutral', x:308,y:462,ly:42,     threat:'Moderate — hunters',   desc:'Rodian homeworld. Underworld contacts.'},
  {id:'reaper',  name:"Reaper's Drift",          type:'pirate',  x:138,y:268,ly:18,     threat:'Pirate gangs',         desc:'Three gangs. No Imperial patrols. Kel Vane arms dealer.'},
  {id:'smugrun', name:"Smuggler's Run",          type:'pirate',  x:468,y:148,ly:108,    threat:'Syndicate enforcers',  desc:'Asteroid maze. Corellian Syndicate toll.'},
  {id:'terminus',name:'Terminus Station',        type:'pirate',  x:72, y:488,ly:34,     threat:'Unpredictable',        desc:'Drax Solenne. Secret Endor route. Last stop before Wild Space.'},
  {id:'relay',   name:'Relay Station AR-7',      type:'hidden',  x:208,y:308,ly:29,     threat:'Ghost station',        desc:'12 dead crew. LAZARUS files. Mission 2-3.'},
  {id:'endor',   name:'Endor (Forest Moon)',     type:'hidden',  x:138,y:535,ly:44,     threat:'Maximum — AT-ATs',     desc:'Installation Omega. Project LAZARUS. Act III climax.'},
  {id:'hammer',  name:'ISD Hammer of Patience',  type:'hidden',  x:482,y:168,ly:null,   threat:'Nemesis-level',        desc:'Captain Renaus. Active pursuit at Heat 4+.'},
  {id:'kwenn',   name:'Kwenn Space Station',     type:'waypoint',x:368,y:438,ly:55,     threat:'Low — surveillance',   desc:'Major junction. Fuel. Thrice the info broker.'},
  {id:'maw',     name:'Maw Approach Nebula',     type:'hazard',  x:88, y:285,ly:null,   threat:'Navigation hazard',    desc:'Ion nebula. Ships disappear. Smuggler cover.'},
  {id:'debris',  name:'Derrilyn Debris Belt',    type:'hazard',  x:628,y:308,ly:null,   threat:'Environmental',        desc:'Asteroid belt. Post-mission: Derrilyn wreckage joins.'},
] as const

export const LANES = [
  {a:'base',b:'kessel'}, {a:'base',b:'relay'}, {a:'base',b:'ryloth'}, {a:'base',b:'reaper'}, {a:'base',b:'terminus'},
  {a:'alpha',b:'sullust'}, {a:'alpha',b:'ryloth'}, {a:'beta',b:'sullust'}, {a:'beta',b:'endor',h:true},
  {a:'ryloth',b:'ordmant'}, {a:'ryloth',b:'kwenn'}, {a:'ryloth',b:'sullust'}, {a:'ryloth',b:'rodia'},
  {a:'sullust',b:'kwenn'}, {a:'sullust',b:'endor',h:true},
  {a:'kwenn',b:'rodia'}, {a:'kwenn',b:'naboo'}, {a:'kwenn',b:'ordmant'},
  {a:'ordmant',b:'typhojem'}, {a:'typhojem',b:'corellia'},
  {a:'corellia',b:'naboo'}, {a:'corellia',b:'smugrun',h:true},
  {a:'naboo',b:'derrilyn'}, {a:'derrilyn',b:'eriadu'}, {a:'derrilyn',b:'typhojem'},
  {a:'relay',b:'ryloth',h:true}, {a:'relay',b:'kessel',h:true},
  {a:'reaper',b:'kessel'}, {a:'reaper',b:'maw'},
  {a:'smugrun',b:'ordmant'}, {a:'smugrun',b:'typhojem'},
  {a:'terminus',b:'endor',h:true}, {a:'terminus',b:'sullust'},
  {a:'maw',b:'kessel'}, {a:'eriadu',b:'naboo'},
  {a:'hammer',b:'typhojem',h:true}, {a:'hammer',b:'corellia',h:true},
  {a:'alpha',b:'base',c:true}, {a:'beta',b:'base',c:true},
] as any[]

export const TYPE_META: Record<string,{color:string,label:string}> = {
  home:    {color:'#4fc3f7',label:'Homebase'},
  rebel:   {color:'#66bb6a',label:'Rebel Cell'},
  command: {color:'#00e5ff',label:'Alliance Command'},
  imperial:{color:'#ef5350',label:'Imperial Garrison'},
  neutral: {color:'#ffa726',label:'Neutral / Trading'},
  pirate:  {color:'#ff7043',label:'Pirate Haven'},
  hidden:  {color:'#ab47bc',label:'Hidden Installation'},
  waypoint:{color:'#78909c',label:'Waypoint / Fuel'},
  hazard:  {color:'#f06292',label:'Hazard Zone'},
}

export const LOCATION_DATA: Record<string,{
  overview:string; atmosphere:string;
  poi:{name:string;desc:string}[];
  shops:{name:string;type:string;desc:string;inventory?:string}[];
  npcs:{key:string;name:string;role:string;desc:string;hook?:string}[];
  quests:{name:string;type:string;difficulty:string;reward:string;desc:string;gmHook:string}[];
  dmNotes?:string;
}> = {
  base:{
    overview:"Kal'Shara Station is a hidden Rebel base concealed within a hollowed-out asteroid in the Outer Rim. It serves as the operational headquarters for the Silent Running cell, housing command, medical, and technical facilities.",
    atmosphere:"Cold durasteel corridors humming with recycled air. The constant flicker of status consoles and the distant clank of maintenance droids. Everyone here knows the Empire could find them at any moment.",
    poi:[
      {name:"Command Center",desc:"The nerve centre of the base — holographic star maps, communication arrays, and tactical terminals. General Cracken runs briefings here."},
      {name:"Med Bay",desc:"Dr. Yara Senn's domain. Fully equipped for combat triage and long-term care. A bacta tank sits in the corner, always warm."},
      {name:"Hangar Bay",desc:"Room for six starfighters and two transports. Currently holds the cell's X-wings, a YT-1300 freighter, and a captured Lambda shuttle."},
      {name:"Crew Quarters",desc:"Cramped but clean. Lira Tessek keeps morale high with improvised decorations and scheduled social hours."},
      {name:"Armory",desc:"Weapons, explosives, and field gear. Strictly logged. Lira manages the inventory."},
    ],
    shops:[
      {name:"Supply Depot",type:"Supplies & Equipment",desc:"Basic survival gear, rations, and field equipment. Run by maintenance droid R4-P9.",inventory:"Rations (Enc 1, 5cr), Macrobinoculars (Enc 1, 75cr), Comm unit (Enc 1, 25cr), Medpac (Enc 2, 100cr)"},
    ],
    npcs:[
      {key:"cracken",name:"General Airen Cracken",role:"Rebel Intelligence Chief",desc:"A weathered veteran of a dozen campaigns, Cracken never wastes words. He assigns missions and debriefs operatives with quiet intensity."},
      {key:"yara",name:"Dr. Yara Senn",role:"Chief Medical Officer",desc:"A former Imperial medic who defected after witnessing an atrocity on Ghorman. Brilliant, sardonic, and fiercely protective of her patients.",hook:"Secretly intercepting Imperial medical supply shipments through a contact she won't name. She fears her past will catch up with her."},
      {key:"lira",name:"Lira Tessek",role:"Quartermaster / Morale Officer",desc:"Admiral Tessek's estranged daughter. She never talks about her father. Efficient, warm, and quietly furious about the Empire.",hook:"Has received an encrypted message from someone claiming to be her father's aide. She hasn't opened it."},
    ],
    quests:[
      {name:"Supply Run",type:"Logistics",difficulty:"Average (2 difficulty)",reward:"500 cr + 10 XP",desc:"The base is running low on bacta and power cells. A supply cache on Ord Mantell has been identified — get in, grab the supplies, get out before Imperial patrols notice.",gmHook:"The supply cache is being watched by ISB Agent Sollus, who suspects a Rebel contact in the area. The PCs may be walking into a trap."},
      {name:"Signal Ghost",type:"Investigation",difficulty:"Hard (3 difficulty)",reward:"15 XP",desc:"A faint, repeating signal is being picked up on an encrypted Rebel frequency. It could be a survivor, a distress beacon, or an Imperial lure. Trace the source.",gmHook:"The signal is from a Rebel courier droid shot down eight months ago. Its memory banks contain the identities of three deep-cover agents the Empire doesn't know about yet."},
    ],
    dmNotes:"The base's location is known only to senior command. If the Imperials ever get a nav-lock from a captured ship, the entire cell has 48 hours before a Star Destroyer arrives. Lira's father (Admiral Vorn Tessek) is actively searching for her — he believes she was kidnapped by Rebels. This is a slow-burn revelation for Act 2. General Cracken knows about the Tessek situation and is watching to see how the PCs handle it.",
  },
  ryloth:{
    overview:"Ryloth is the arid, tidally-locked homeworld of the Twi'lek species. The Imperial occupation is harsh but thin outside major cities — desert canyons and hidden villages shelter rebel sympathisers and resistance cells.",
    atmosphere:"Hot, dusty winds carry the scent of mineral deposits and hard lives. The cities are under Imperial curfew. The villages beyond the patrol lanes feel ancient and defiant.",
    poi:[
      {name:"Lessu",desc:"The capital city, heavily garrisoned. Imperial AT-STs patrol the main boulevards. A black market operates beneath the surface through a network of Twi'lek guides."},
      {name:"The Shadow Caves",desc:"A labyrinthine cave network used by resistance fighters. Known to local guides — not on any Imperial map."},
      {name:"Mira's Cantina",desc:"A low-lit drinking establishment in the outskirts of Lessu, nominally neutral territory. Actually a Rebel safe house run by Mira Volante."},
    ],
    shops:[
      {name:"Mira's Cantina",type:"Cantina / Black Market",desc:"Food, drink, and discrete transactions. Mira Volante has access to weapons and information for the right price.",inventory:"Blaster pistol (Enc 1, 400cr), Stun grenades x2 (Enc 1, 50cr each), Encrypted comlink (Enc 1, 150cr), Local guides (service, 100cr/day)"},
    ],
    npcs:[
      {key:"mira",name:"Mira Volante",role:"Rebel Contact / Black Market Dealer",desc:"A sharp-tongued human woman who has lived on Ryloth for a decade. She speaks fluent Ryl and knows every underground route on the planet. She's been burned before and trust doesn't come easy.",hook:"Mira is feeding information to both the Rebel cell AND a neutral crime syndicate. She believes she's playing both sides safely. She's wrong."},
    ],
    quests:[
      {name:"Free the Hostages",type:"Rescue",difficulty:"Hard (3 difficulty)",reward:"800 cr + 20 XP",desc:"Imperial forces have arrested twelve Twi'lek villagers suspected of harbouring rebels. They're being held in a garrison outpost outside Lessu before transfer to an off-world detention facility. Extract them before the transport arrives.",gmHook:"One of the hostages is the uncle of a local resistance leader. If he dies, that leader takes revenge in a way that blows the Rebel cell's cover."},
      {name:"Ghost Frequency",type:"Intelligence",difficulty:"Average (2 difficulty)",reward:"10 XP",desc:"Intercept an Imperial coded transmission being broadcast from a relay station in the hills above Lessu. Mira has the coordinates. The Empire must not know it was compromised.",gmHook:"The transmission contains troop deployment orders for a major Outer Rim sweep — including one that will uncover Haven Alpha if not countered."},
    ],
    dmNotes:"Imperial garrison at Lessu is at 60% strength — a battalion was recently redeployed to Kessel. Window of relative weakness: roughly 3 sessions. Mira's double-dealing will surface in Act 2 when the syndicate asks her to sell the party's identities.",
  },
  ordmant:{
    overview:"Ord Mantell is a lawless junkyard of a planet — a core world gone to seed. Imperial presence is concentrated around the spaceport and military outpost. The rest is scrapyards, gambling dens, and bounty hunter haunts.",
    atmosphere:"The air smells of ozone, grease, and stale beer. Everyone here is running from something or hunting someone. The Empire stays in its lane as long as credits keep moving.",
    poi:[
      {name:"Worlport Spaceport",desc:"The planet's main port of entry. Imperial customs checkpoint on the main docking bay. Bribes widely accepted."},
      {name:"The Scrap Yards",desc:"Square kilometres of derelict starships and abandoned tech. A smuggler's paradise — and a good place to disappear."},
      {name:"Kesh's Garage",desc:"Varro Kesh's legitimate-seeming repair shop. Actually a front for fencing stolen goods and selling information."},
      {name:"The Rusty Hyena",desc:"A cantina popular with bounty hunters and mercs. ISB uses it as a casual observation post."},
    ],
    shops:[
      {name:"Kesh's Garage",type:"Parts & Black Market",desc:"Vehicle and ship parts, plus whatever else Kesh has come across. Negotiation required.",inventory:"Starship parts (various, 50–2000cr), Blaster rifle (Enc 3, 900cr), Ion grenades x3 (Enc 1, 200cr each), Stolen Imperial access codes (150cr, limited use)"},
      {name:"The Rusty Hyena",type:"Cantina",desc:"Drinks, rumours, and trouble. Bounty postings on the wall.",inventory:"Drinks (1–5cr), Rumours (10cr, quality varies), Bounty leads (varies)"},
    ],
    npcs:[
      {key:"varro",name:"Varro Kesh",role:"Smuggler / Information Broker",desc:"A pragmatic Zabrak who has survived on Ord Mantell by knowing when to talk and when to shut up. He doesn't like the Empire but he doesn't like dying more. Price his loyalty before you lean on it.",hook:"Kesh is behind on payments to a Hutt crime lord. The Hutt's enforcers are coming. He'll sell almost anything to cover the debt — including what he knows about Rebel supply routes."},
      {key:"sollus",name:"ISB Agent Sollus",role:"Imperial Security Bureau Agent",desc:"A nondescript human in plain clothes who is never not watching. Stationed on Ord Mantell specifically to monitor rebel activity in the sector. Cold, patient, precise.",hook:"Sollus has a partial dossier on the Silent Running cell. He's building a case slowly and methodically. The PCs showing up on Ord Mantell accelerates his timeline."},
    ],
    quests:[
      {name:"The Stolen Manifest",type:"Retrieval",difficulty:"Average (2 difficulty)",reward:"600 cr + 10 XP",desc:"A shipping manifest detailing Imperial supply routes through the sector has been lifted from a customs officer. Get it before the ISB does.",gmHook:"The customs officer who was robbed is actually an Imperial plant. The 'manifest' is bait designed to lure Rebel contacts into the open — directly into Sollus's surveillance net."},
    ],
    dmNotes:"Sollus has four undercover agents on the ground on Ord Mantell. He does not engage directly — he watches, logs, and waits. If the PCs draw too much attention here, expect a 2-point Heat increase. Kesh can be turned into a reliable (if mercenary) ally if his Hutt debt is cleared (~3000cr).",
  },
  corellia:{
    overview:"Corellia is a wealthy, heavily populated core world with a proud tradition of independence — and a thriving black market operating under the Empire's nose. CorSec (Corellian Security) maintains an uneasy relationship with Imperial forces.",
    atmosphere:"The skyline of Coronet City glitters at night. Below the surface glamour, old loyalties and new resistance seethe. People talk in code here — it's an art form.",
    poi:[
      {name:"Coronet City",desc:"The planetary capital. Gleaming towers, an active port, and a CorSec precinct on every other block. Imperial Garrison in the industrial quarter."},
      {name:"The Corellian Undercroft",desc:"A network of subterranean trade routes beneath Coronet City, used by smugglers and resistance fighters alike."},
      {name:"Shipwright Row",desc:"Corellia's legendary shipyards. Bustling, noisy, and an excellent place to acquire ships or components with minimal questions."},
    ],
    shops:[
      {name:"Shipwright Row",type:"Ship Parts & Modifications",desc:"High-quality parts and skilled mechanics. More expensive than the Outer Rim but far better quality.",inventory:"Hull plating (Enc 3, 300cr), Hyperdrive motivator (Enc 2, 800cr), Sensor jammer (Enc 2, 1200cr), Starfighter upgrade (service, 2000cr+)"},
    ],
    npcs:[
      {key:"sable",name:"Sable (Kael Orun)",role:"Rebel Sleeper Agent / CorSec Officer",desc:"A CorSec detective with a hidden Rebel affiliation. Immaculate uniform, sharp eyes, by-the-book in public. In private — a careful resistance operative with access to Imperial communications logs.",hook:"Sable has discovered that a CorSec colleague is feeding information to ISB. That colleague has seen Sable meeting with Rebel contacts. It's a race to neutralise the threat without exposing the cell."},
    ],
    quests:[
      {name:"The CorSec Connection",type:"Intelligence",difficulty:"Hard (3 difficulty)",reward:"15 XP + Corellia contact established",desc:"Make contact with the Rebel sleeper agent embedded in CorSec. Extract information on upcoming Imperial fleet movements without blowing their cover.",gmHook:"The meet is already compromised — ISB tagged one of the cell's courier droids three days ago. The PCs are walking into a surveillance situation. Sable knows but can't warn them in time."},
    ],
    dmNotes:"Sable's cover is fraying. Give them 2–3 more sessions before ISB moves to arrest. If the PCs help burn the ISB informant, Sable becomes a long-term reliable contact with access to Imperial naval schedules. Any open firefight triggers a 3-point Heat increase — Moff-level Imperial presence.",
  },
  naboo:{
    overview:"Naboo is a lush, beautiful world of rolling plains and underwater cities, administered by an elected monarch but increasingly under the thumb of Imperial Governor Pennath Vaal. The population is quietly resentful.",
    atmosphere:"Golden sunlight on marble architecture. The calm is a veneer — Vaal's enforcers move through the city at all hours and disappearances are becoming more common.",
    poi:[
      {name:"Theed",desc:"The capital city. Imperial garrison in what was once the Royal Palace quarter. The elected Queen maintains a symbolic presence."},
      {name:"The Gungan Marshes",desc:"The wetlands surrounding the city. Gungan communities are largely ignored by the Empire — and used by resistance runners as a result."},
      {name:"Governor's Palace",desc:"Pennath Vaal's seat of power. Heavily guarded, lavishly appointed, and full of secrets."},
    ],
    shops:[],
    npcs:[
      {key:"vaal",name:"Director Pennath Vaal",role:"Imperial Governor of Naboo",desc:"A cultured, precise man who genuinely believes the Empire improves the lives of those it governs. He is not cruel for pleasure — he is cruel for efficiency. This makes him more dangerous, not less.",hook:"Vaal has been running a COMPNOR youth indoctrination program on Naboo — results have been outstanding. He's preparing a report that, if adopted Empire-wide, would make Imperial loyalty programs significantly more effective. This report must be stolen or destroyed."},
    ],
    quests:[
      {name:"The Vaal Report",type:"Espionage",difficulty:"Daunting (4 difficulty)",reward:"25 XP + significant strategic value",desc:"Steal or destroy Director Vaal's COMPNOR youth programme report before it reaches Imperial City. The report is stored in the Governor's Palace vault with biometric access controls.",gmHook:"Vaal suspects a theft attempt — not from Rebels, but from a rival Imperial official. His security has increased but he's watching the wrong threat. This actually helps the PCs if they're clever."},
    ],
    dmNotes:"Vaal is dangerous but not personally combat-capable — he relies entirely on his security detail. The Gungan communities can be cultivated as allies (Difficult Charm/Negotiation check) — they know every secret route through the marshes and have no love for the Empire.",
  },
  sullust:{
    overview:"Sullust is a volcanic world dominated by SoroSuub Corporation, which has formally aligned with the Empire. Despite this, many Sullustan workers secretly support the Rebellion, and Nien Nunb coordinates an underground resistance network.",
    atmosphere:"Acrid sulphur in the air, the constant rumble of industrial machinery. SoroSuub facilities glow orange against the dark sky. Workers' housing blocks are cramped and strictly monitored.",
    poi:[
      {name:"Pinyumb",desc:"The largest underground city and SoroSuub's corporate headquarters. All business goes through here."},
      {name:"The Lava Tunnels",desc:"A network of natural tunnels beneath the SoroSuub facilities. Used by workers to move between areas off the corporate surveillance grid."},
      {name:"Docking Bay 7-G",desc:"A maintenance bay nominally reserved for SoroSuub vessels. Actually used by Nien Nunb as a covert staging area."},
    ],
    shops:[
      {name:"SoroSuub Outlet",type:"Corporate Supply",desc:"Standard SoroSuub merchandise — legitimately priced but leaves a record. Cash deals with workers off the books are possible.",inventory:"Blaster pistol (Enc 1, 350cr), Ion weapon upgrade (Enc 1, 800cr), Mining charges (Enc 2, 100cr each), SoroSuub uniform (Enc 1, 20cr) — good disguise"},
    ],
    npcs:[
      {key:"nunnb",name:"Nien Nunb",role:"Rebel Coordinator / SoroSuub Underground",desc:"A gregarious Sullustan with a broad network of contacts throughout the SoroSuub workforce. He laughs often but misses nothing. His resistance network has been running for two years without a single leak.",hook:"Nien has discovered SoroSuub is manufacturing a new sensor component for Imperial warships — production is three months from completion. He wants it sabotaged but needs outside help to avoid blowing his network."},
    ],
    quests:[
      {name:"Production Halt",type:"Sabotage",difficulty:"Hard (3 difficulty)",reward:"20 XP + Sullust resistance allied",desc:"Infiltrate the SoroSuub production facility and destroy the sensor component assembly line. It must look like an industrial accident.",gmHook:"Three SoroSuub security supervisors are secretly Imperial informants. They're already suspicious of unusual activity. Any open firefight locks down the entire facility."},
    ],
    dmNotes:"Nien Nunb is a long-term strategic asset. If the PCs treat his network with respect, he becomes a reliable source of Imperial manufacturing intelligence for the rest of the campaign. SoroSuub corporate security uses private mercenaries, not Stormtroopers — less lethal but more numerous.",
  },
  kessel:{
    overview:"Kessel is a harsh mining world on the edge of a black hole cluster, famous for its spice mines. Imperial control is absolute — slave labour, brutal overseers, and a permanent garrison. An Inquisitor has recently been stationed here.",
    atmosphere:"The air is thin and bitter. The mines go deep. Screams echo. Nobody talks about what happens in the lower shafts.",
    poi:[
      {name:"The Spice Mines",desc:"Vast underground excavations staffed by slave labour. Imperial overseers on every level. The spice is valuable — the workers are not."},
      {name:"Imperial Garrison Kessel",desc:"A fully-staffed Imperial military installation with TIE Fighter complement. The Inquisitor has a private suite on the top floor."},
      {name:"The Maw Approach",desc:"The dangerous passage through the black hole cluster. Only experienced pilots navigate it. Smugglers know shortcuts the Empire has never found."},
    ],
    shops:[],
    npcs:[
      {key:"verath",name:"Inquisitor Verath",role:"Imperial Inquisitor (Force Hunter)",desc:"Verath moves like something that used to be human and decided it didn't have to be anymore. Cold eyes, patient voice, and a clinical interest in Force-sensitives. Assigned to Kessel after reports of a Force-sensitive among the mine workers.",hook:"Verath has a list — not just Force-sensitives, but every Rebel operative he's identified in the sector. He reviews it every morning. The PCs' names may already be there."},
    ],
    quests:[
      {name:"The Sensitive",type:"Rescue",difficulty:"Daunting (4 difficulty)",reward:"30 XP + major Rebel goodwill",desc:"A Force-sensitive child is among the slave labourers in the Kessel mines. Extract them before Verath identifies and takes them. Time is very short.",gmHook:"Verath has already noticed the child. He's waiting — using the child as bait to draw out anyone who comes for them. The rescue is a trap, and Verath is personally waiting at the exit."},
    ],
    dmNotes:"Kessel should feel like a horror location. The Inquisitor is NEMESIS-grade — direct confrontation at this stage is suicide. The point is to feel his presence and perhaps force a desperate escape. Verath is not stupid and will not engage on ground that doesn't favour him.",
  },
  reaper:{
    overview:"Reaper's Drift is a dense debris field — the remnant of a destroyed space station. Pirates and scavengers have carved out a lawless stronghold among the wreckage. Boss Kel Vane controls the territory.",
    atmosphere:"Wreckage slowly rotating against the void. Docking clamps grafted onto shattered hull plates. The smell of recycled air and other people's desperation. No laws apply here.",
    poi:[
      {name:"The Core Hub",desc:"The main habitation section, pieced together from three different ships' crew quarters. Kel Vane holds court here."},
      {name:"The Chop Yard",desc:"Where captured ships get stripped. Drax Solenne oversees operations with an eye for value."},
      {name:"The Floating Market",desc:"A zero-gravity open market in the largest intact compartment of the wreck. Anything can be bought here for the right price."},
    ],
    shops:[
      {name:"The Floating Market",type:"Black Market",desc:"No questions asked. Significant markup. Everything is theoretically available given enough credits and time.",inventory:"Military-grade weapons (+20% above book price), Stolen ship parts (50% of book price), Fake identities (500cr), Bounty hunter contacts (service, 200cr intro fee)"},
    ],
    npcs:[
      {key:"kelvane",name:"Boss Kel Vane",role:"Pirate Lord",desc:"A heavyset Devaronian who runs Reaper's Drift through a combination of charisma, violence, and a very good memory for debts. He's not loyal to anyone but he respects strength and credits.",hook:"Kel Vane recently acquired a crate of Imperial encryption hardware from a raid on a courier vessel. He doesn't know what it is. The Empire very much wants it back — and is offering a bounty. He'll sell to whoever gets there first."},
      {key:"drax",name:"Drax Solenne",role:"Pirate Lieutenant / Ship Stripper",desc:"A meticulous Mirialan who treats ship stripping like art. He knows the value of everything and has no sentiment about any of it. Serves Kel Vane loyally — for now.",hook:"Drax is quietly skimming from Kel Vane's operations. If the PCs discover this, they have leverage — but if Drax thinks they'll tell Vane, he'll try to kill them first."},
    ],
    quests:[
      {name:"The Encrypted Crate",type:"Acquisition",difficulty:"Hard (3 difficulty)",reward:"Imperial encryption hardware + 1000 cr",desc:"Acquire the Imperial encryption hardware before the Empire's bounty hunters arrive. Kel Vane will sell it — the question is whether the price is credits, a favour, or a fight.",gmHook:"The hardware contains communications logs from a Star Destroyer — including patrol schedules for the entire sector. Once decrypted by Alliance Intelligence this becomes a major strategic advantage. The Imperials know exactly what they lost and are escalating."},
    ],
    dmNotes:"Reaper's Drift is morally grey territory — valuable as a resource but always dangerous. Kel Vane can be cultivated as a reliable (if expensive) fence and information source. Do not let the PCs get comfortable here — someone always wants something from them.",
  },
  kwenn:{
    overview:"Kwenn Space Station is a massive commercial platform at a major hyperspace junction. It serves thousands of ships daily and hosts traders, travellers, and Imperial customs alongside a sprawling civilian population.",
    atmosphere:"The smell of a thousand different food stalls competing with engine exhaust. Crowds press through narrow corridors. The Empire watches from elevated platforms — but there's too much to watch.",
    poi:[
      {name:"The Grand Concourse",desc:"Kwenn's main commercial thoroughfare. Packed at all hours. A pickpocket's paradise and a surveillance nightmare for Imperial forces."},
      {name:"Docking Ring 9",desc:"The less-regulated outer ring where smaller, less scrupulous vessels dock. Imperial inspections here are infrequent."},
      {name:"Merrak's Exchange",desc:"A reputable — if flexible — money changing and cargo brokering operation. Good place to move sensitive cargo or exchange currency without a trail."},
    ],
    shops:[
      {name:"The Grand Concourse",type:"Mixed Markets",desc:"Every category of goods available in small quantities. No specialisation but excellent variety.",inventory:"Standard equipment at book price, Medpac (Enc 2, 100cr), Comlink (Enc 1, 25cr), Datapad (Enc 1, 75cr), Various disguise items (10–100cr)"},
      {name:"Merrak's Exchange",type:"Financial / Cargo Services",desc:"Currency exchange, cargo documentation, and discrete shipping arrangements.",inventory:"Fake shipping manifests (200cr), Clean credit exchange (5% fee), Black market cargo routing (10% of cargo value)"},
    ],
    npcs:[],
    quests:[
      {name:"Dead Drop",type:"Courier",difficulty:"Average (2 difficulty)",reward:"400 cr + 8 XP",desc:"Pick up a dead drop left by an Alliance courier who never checked in. The drop is in Docking Ring 9. Imperial customs is running spot checks this week. Don't attract attention.",gmHook:"The original courier was captured three days ago. Imperial Intelligence has already found and replaced the dead drop with a tracker. Picking it up tags the PCs' ship."},
    ],
    dmNotes:"Kwenn is a good resupply and information-gathering hub. Imperial presence is spread thin due to the station's size — any individual incident gets lost in the noise unless it's spectacular. Arriving at Kwenn adds 1 Heat automatically as Imperial scanners log the PCs' ship on arrival.",
  },
  terminus:{
    overview:"Terminus Station is an Imperial military communications relay and patrol base disguised as a civilian waypoint station. Captain Elia Renaus commands the garrison; Lieutenant Daven Osk manages day-to-day operations.",
    atmosphere:"Sterile, precise, and watchful. Every corridor has a camera. Every docking request is verified twice. The civilian cover story is thin enough to see through if you know what to look for.",
    poi:[
      {name:"Command Deck",desc:"Renaus runs operations from here. The main communications array feeds directly to Sector Command."},
      {name:"Prisoner Block",desc:"Three cells. Currently empty — but not for long if the PCs draw attention."},
      {name:"Communications Array",desc:"The primary reason this station exists. If taken offline, Sector Command loses contact with six patrol routes."},
    ],
    shops:[],
    npcs:[
      {key:"renaus",name:"Captain Elia Renaus",role:"Imperial Station Commander",desc:"A career officer who earned her rank through competence and ruthlessness. She believes absolutely in the Empire and has no patience for failure — her own or others'. She will not underestimate the PCs twice.",hook:"Renaus is using station resources to run a private investigation into who sabotaged an Imperial convoy three months ago. She's close to identifying the cell. This investigation is off-book — if her superiors found out she'd face consequences."},
      {key:"osk",name:"Lieutenant Daven Osk",role:"Imperial Station Executive Officer",desc:"Polite, professional, and slightly terrified of Renaus. He follows orders precisely and without initiative. Privately, he hates what he's been ordered to do to civilian ships. He has not acted on this. Yet.",hook:"Osk has compiled evidence of Renaus's private investigation. He's keeping it as insurance. He would defect given a safe way out — but he won't make the first move."},
    ],
    quests:[
      {name:"Blackout",type:"Sabotage",difficulty:"Hard (3 difficulty)",reward:"20 XP + significant strategic value",desc:"Destroy or disable the Terminus Station communications array. This creates a 72-hour blind spot in Imperial patrol coordination across six routes — a window the Alliance desperately needs.",gmHook:"Renaus anticipated an attack on the array and has set a trap — 'disabling' it triggers a silent alarm. Osk knows about this trap. Whether he tells the PCs depends on whether they've given him a reason to trust them."},
    ],
    dmNotes:"Osk is a potential defector — treat him as a slow-burn asset. His evidence against Renaus could be used to have her recalled if it reaches rival Imperial bureaucrats. If Renaus survives the Blackout mission, she escalates her private investigation with renewed focus.",
  },
  alpha:{
    overview:"Haven Alpha is a secret Rebel Alliance staging area in a remote system, used for fleet coordination and strike team assembly. Admiral Vorn Tessek commands this installation.",
    atmosphere:"Efficient military discipline. Everyone here knows the stakes. The Admiral's presence raises both confidence and tension — he is exacting and expects results.",
    poi:[
      {name:"Fleet Staging Area",desc:"Multiple Alliance frigates and support vessels in coordinated formation. The Alliance's real military might, rarely seen by operatives."},
      {name:"Briefing Theatre",desc:"Where major operation orders are issued. The holographic displays show the full strategic picture."},
      {name:"The Admiral's Office",desc:"Tessek runs Haven Alpha with precision. He is never without his aide, who manages his communications and schedule."},
    ],
    shops:[],
    npcs:[
      {key:"tessek",name:"Admiral Vorn Tessek",role:"Alliance Fleet Commander",desc:"A tall, silver-haired human of absolute military bearing. He commands Haven Alpha and coordinates large-scale Alliance operations in the sector. He is searching for his daughter, Lira, though he doesn't know she's at Kal'Shara.",hook:"Tessek is not fully aware that his daughter defected willingly — he believes she was taken. He has diverted Alliance Intelligence resources toward finding her. General Cracken is quietly furious but has not confronted him directly. When the PCs discover the connection, both men will want something from them."},
    ],
    quests:[
      {name:"Fleet Coordination",type:"Strategic",difficulty:"Formidable (5 difficulty)",reward:"50 XP + major Alliance advancement",desc:"Carry a sealed operational plan between Haven Alpha and Kal'Shara without interception. The plan details the Alliance's next major strike. If it falls into Imperial hands, the operation — and perhaps the fleet — is lost.",gmHook:"There is an Imperial sleeper agent on Haven Alpha. They don't know the plan's contents but they know it's being transported. The PCs are the target from the moment they leave the station."},
    ],
    dmNotes:"Haven Alpha is a late-campaign location — high stakes, high security. Tessek is a potential adversary if his search for Lira brings him into conflict with Kal'Shara. The revelation that Lira left willingly is a campaign pivot moment. Tessek is not a villain, just a father who can't see clearly.",
  },
}

export const NPC_STATS: Record<string,{
  name:string; type:'NEMESIS'|'RIVAL'|'ALLY'|'MINION'; species:string; career:string;
  brawn:number; agility:number; intellect:number; cunning:number; willpower:number; presence:number;
  soak:number; woundThreshold:number; strainThreshold?:number;
  defense:{ranged:number;melee:number}; forceRating?:number; adversary?:number;
  skills:{name:string;rank:number}[];
  talents:{name:string;desc:string}[];
  weapons:{name:string;damage:string;critical:number;range:string;qualities:string}[];
  abilities:string[]; equipment:string; desc:string; hook:string;
}> = {
  verath:{
    name:"Inquisitor Verath",type:"NEMESIS",species:"Human (Dark Side)",career:"Inquisitor",
    brawn:3,agility:4,intellect:3,cunning:4,willpower:5,presence:3,
    soak:5,woundThreshold:18,strainThreshold:16,
    defense:{ranged:2,melee:2},forceRating:3,adversary:3,
    skills:[{name:"Lightsaber",rank:4},{name:"Coercion",rank:3},{name:"Perception",rank:3},{name:"Vigilance",rank:3},{name:"Discipline",rank:3},{name:"Athletics",rank:2},{name:"Stealth",rank:2},{name:"Computers",rank:2}],
    talents:[
      {name:"Adversary 3",desc:"Upgrade the difficulty of all combat checks targeting this character three times."},
      {name:"Reflect 4",desc:"When hit by a ranged attack, suffer 3 strain to reduce damage by 9."},
      {name:"Parry 5",desc:"When hit by a melee attack, suffer 3 strain to reduce damage by 10."},
      {name:"Fearsome",desc:"At the start of combat, all opponents must make a Fear check (Average difficulty)."},
      {name:"Force Sense",desc:"Sense all living things within short range, or detect Force users at medium range."},
      {name:"Move",desc:"Move objects up to silhouette 1 as a maneuver; larger objects with more Force points."},
    ],
    weapons:[
      {name:"Double-bladed Lightsaber",damage:"Brawn+3 (6)",critical:1,range:"Engaged",qualities:"Breach 1, Sunder, Linked 1, Cortosis"},
      {name:"Force Power: Bind",damage:"Immobilize",critical:0,range:"Medium",qualities:"Target cannot act; additional Force points add effects"},
    ],
    abilities:["Force Power: Sense","Force Power: Move","Force Power: Bind","Dark Side — may spend Destiny Points to recover strain"],
    equipment:"Double-bladed lightsaber, Inquisitor armour (Def 2, Soak +2), Imperial comlink, datapad with wanted list",
    desc:"Cold, methodical, and utterly certain in his purpose. Verath does not waste energy on cruelty — suffering is simply a tool.",
    hook:"Verath has the PCs on his list. He won't move until he has complete information — then he'll close the trap with precision. His greatest weakness is patience becoming complacency.",
  },
  renaus:{
    name:"Captain Elia Renaus",type:"NEMESIS",species:"Human",career:"Imperial Officer",
    brawn:2,agility:3,intellect:4,cunning:4,willpower:4,presence:4,
    soak:4,woundThreshold:16,strainThreshold:18,
    defense:{ranged:1,melee:1},adversary:2,
    skills:[{name:"Leadership",rank:4},{name:"Tactics",rank:3},{name:"Computers",rank:3},{name:"Coercion",rank:3},{name:"Vigilance",rank:3},{name:"Ranged (Light)",rank:2},{name:"Deception",rank:2},{name:"Perception",rank:3}],
    talents:[
      {name:"Adversary 2",desc:"Upgrade the difficulty of all combat checks targeting this character twice."},
      {name:"Commanding Presence 2",desc:"Remove two setback dice from Leadership and Cool checks."},
      {name:"Tactical Combat Training",desc:"May use Tactics skill instead of Cool for initiative checks."},
      {name:"Unrelenting",desc:"Once per session, ignore the effects of a Critical Injury until end of encounter."},
    ],
    weapons:[
      {name:"Heavy Blaster Pistol",damage:"7",critical:3,range:"Medium",qualities:"Stun Setting"},
      {name:"Vibroblade",damage:"Brawn+2 (4)",critical:2,range:"Engaged",qualities:"Pierce 2, Vicious 1"},
    ],
    abilities:["Commander — all Imperial forces under her command add one boost die to combat checks","Tactical Genius — once per encounter may redeploy all friendly minion groups as a free action"],
    equipment:"Imperial Captain's uniform (Soak +2, Def +1), heavy blaster pistol, vibroblade, command datapad, encrypted comlink",
    desc:"Renaus earned every rank the hard way. She is not cruel — she is efficient. The difference matters until you're on the wrong side of her.",
    hook:"Her off-book investigation is her blind spot. Expose it and you can neutralise her — but she'll know it was you.",
  },
  varro:{
    name:"Varro Kesh",type:"RIVAL",species:"Zabrak",career:"Smuggler",
    brawn:3,agility:3,intellect:3,cunning:3,willpower:2,presence:3,
    soak:4,woundThreshold:14,
    defense:{ranged:0,melee:0},
    skills:[{name:"Streetwise",rank:3},{name:"Negotiation",rank:3},{name:"Deception",rank:2},{name:"Pilot (Space)",rank:2},{name:"Ranged (Light)",rank:2},{name:"Skullduggery",rank:2}],
    talents:[
      {name:"Black Market Contacts",desc:"Reduce the rarity of any item by 1 (minimum 0) when negotiating."},
      {name:"Convincing Demeanor",desc:"Remove one setback die from Deception and Skullduggery checks."},
    ],
    weapons:[
      {name:"Blaster Pistol",damage:"6",critical:3,range:"Medium",qualities:"Stun Setting"},
      {name:"Holdout Blaster",damage:"5",critical:4,range:"Short",qualities:"Stun Setting, Inaccurate 1"},
    ],
    abilities:["Knows a Guy — once per session, identify a useful criminal contact in any location"],
    equipment:"Blaster pistol, holdout blaster, datapad, ~500cr (current), mechanic's tools",
    desc:"Pragmatic above all else. Kesh will help if it's in his interest. Remove the threat to his interest and he becomes genuinely useful.",
    hook:"His Hutt debt (3000cr) is the lever. Pay it off and his loyalty is real — if mercenary. Let it fester and he sells the PCs to cover it.",
  },
  vaal:{
    name:"Director Pennath Vaal",type:"RIVAL",species:"Human",career:"Imperial Administrator",
    brawn:2,agility:2,intellect:4,cunning:4,willpower:3,presence:4,
    soak:2,woundThreshold:12,
    defense:{ranged:0,melee:0},
    skills:[{name:"Deception",rank:3},{name:"Negotiation",rank:3},{name:"Leadership",rank:3},{name:"Coercion",rank:3},{name:"Core Worlds",rank:3},{name:"Perception",rank:2}],
    talents:[
      {name:"Plausible Deniability",desc:"When implicated in wrongdoing, make an opposed Deception vs. Vigilance check to deflect blame."},
      {name:"Nobody's Fool",desc:"Upgrade the difficulty of all Deception checks made against him once."},
    ],
    weapons:[
      {name:"Hold-out Blaster",damage:"5",critical:4,range:"Short",qualities:"Stun Setting"},
    ],
    abilities:["Political Capital — once per session, call in a favour with Imperial bureaucracy for access or resources","Always Watched — 2 Imperial Guard (Rival-grade) are always within short range"],
    equipment:"Hold-out blaster, datapad, encrypted comlink, administrative credentials, COMPNOR report (objective)",
    desc:"Vaal is the Empire at its most mundane and most dangerous. He has the full weight of the Imperial administrative machine behind him, and uses it like a precision instrument.",
    hook:"The COMPNOR report is his magnum opus. Steal or destroy it — but he'll know someone was there, and he'll use every resource to find out who.",
  },
  sollus:{
    name:"ISB Agent Sollus",type:"RIVAL",species:"Human",career:"ISB Agent",
    brawn:2,agility:3,intellect:4,cunning:4,willpower:3,presence:2,
    soak:3,woundThreshold:12,
    defense:{ranged:1,melee:0},
    skills:[{name:"Coercion",rank:3},{name:"Deception",rank:3},{name:"Perception",rank:3},{name:"Ranged (Light)",rank:3},{name:"Computers",rank:2},{name:"Vigilance",rank:3},{name:"Streetwise",rank:2}],
    talents:[
      {name:"Adversary 1",desc:"Upgrade the difficulty of all combat checks targeting this character once."},
      {name:"Hard-Boiled",desc:"When recovering strain, may spend advantage to also recover one wound."},
      {name:"Crippling Blow",desc:"Once per round, after a successful attack, spend 1 advantage to inflict a Critical Injury ignoring one difficulty."},
    ],
    weapons:[
      {name:"Blaster Pistol (modified)",damage:"7",critical:3,range:"Medium",qualities:"Stun Setting, Accurate 1"},
    ],
    abilities:["ISB Network — once per session call on Imperial resources (surveillance data, additional agents, detained witnesses)"],
    equipment:"Modified blaster pistol, light armour vest (Soak +1, Def +1), ISB credentials, encrypted datapad",
    desc:"Sollus doesn't chase. He waits, gathers, and closes. He has been building his file on the Silent Running cell for four months.",
    hook:"He has three contacts on Ord Mantell who report to him. He doesn't know the party's names yet — but he has their faces.",
  },
  osk:{
    name:"Lieutenant Daven Osk",type:"RIVAL",species:"Human",career:"Imperial Officer",
    brawn:2,agility:3,intellect:3,cunning:2,willpower:2,presence:3,
    soak:3,woundThreshold:11,
    defense:{ranged:0,melee:0},
    skills:[{name:"Leadership",rank:2},{name:"Computers",rank:2},{name:"Pilot (Space)",rank:2},{name:"Ranged (Light)",rank:1},{name:"Discipline",rank:1},{name:"Perception",rank:2}],
    talents:[
      {name:"Confidence",desc:"May use Discipline instead of Cool when determining initiative."},
    ],
    weapons:[
      {name:"Blaster Pistol",damage:"6",critical:3,range:"Medium",qualities:"Stun Setting"},
    ],
    abilities:["Reluctant Authority — if convinced his conscience is being served, will provide access codes or station intel rather than fight"],
    equipment:"Blaster pistol, Imperial uniform (no armour), station access codes, encrypted evidence file on Renaus",
    desc:"Osk is not a bad man in a good system. He's a conflicted man who took the wrong job and hasn't found his way out. Yet.",
    hook:"His evidence file on Renaus is the key. He needs a safe exit — the PCs can provide one if they recognise the opportunity.",
  },
  tessek:{
    name:"Admiral Vorn Tessek",type:"RIVAL",species:"Human",career:"Alliance Fleet Officer",
    brawn:2,agility:2,intellect:4,cunning:3,willpower:4,presence:4,
    soak:3,woundThreshold:13,
    defense:{ranged:0,melee:0},
    skills:[{name:"Leadership",rank:4},{name:"Tactics",rank:3},{name:"Knowledge (Warfare)",rank:3},{name:"Negotiation",rank:2},{name:"Perception",rank:2},{name:"Ranged (Light)",rank:1}],
    talents:[
      {name:"Natural Leader",desc:"Once per session, grant one ally an additional free maneuver."},
      {name:"Strategic Commander",desc:"When issuing orders, allies add a boost die to their next check."},
    ],
    weapons:[
      {name:"Blaster Pistol",damage:"6",critical:3,range:"Medium",qualities:"Stun Setting"},
    ],
    abilities:["Fleet Command — in large-scale engagements, all Alliance forces gain one additional Destiny Point"],
    equipment:"Blaster pistol, Admiral's uniform, encrypted comlink, strategic datapads, personal photo of Lira",
    desc:"A great commander and a blind father. His search for Lira is consuming judgment he cannot afford to spend.",
    hook:"When the truth about Lira comes out, Tessek either accepts it — becoming one of the campaign's most valuable assets — or fractures, creating a major internal Alliance crisis. The PCs will determine which.",
  },
  cracken:{
    name:"General Airen Cracken",type:"ALLY",species:"Human",career:"Intelligence Officer",
    brawn:2,agility:3,intellect:4,cunning:4,willpower:4,presence:3,
    soak:3,woundThreshold:14,
    defense:{ranged:1,melee:0},
    skills:[{name:"Leadership",rank:3},{name:"Deception",rank:4},{name:"Perception",rank:3},{name:"Vigilance",rank:3},{name:"Computers",rank:3},{name:"Ranged (Light)",rank:2},{name:"Coercion",rank:2},{name:"Streetwise",rank:3}],
    talents:[
      {name:"Master of Deception",desc:"Remove two setback dice from all Deception checks."},
      {name:"Hard-Boiled",desc:"When recovering strain, may spend extra advantage to recover one wound per advantage."},
      {name:"Network",desc:"Once per session, gain access to one specific piece of intelligence through Alliance channels."},
    ],
    weapons:[
      {name:"Blaster Pistol",damage:"6",critical:3,range:"Medium",qualities:"Stun Setting, Accurate 1"},
    ],
    abilities:["Intel Network — spend one Destiny Point to know an important fact about any Imperial operation in the sector"],
    equipment:"Modified blaster pistol, encrypted comlink, intelligence dossiers, personal datapad",
    desc:"Cracken is the kind of man who wins without fighting. He prefers to know everything, reveal nothing, and let events unfold to his advantage.",
    hook:"Cracken knows about the Tessek situation and is watching to see how the PCs handle it. Their judgement here determines what he entrusts to them next.",
  },
  mira:{
    name:"Mira Volante",type:"ALLY",species:"Human",career:"Smuggler / Operative",
    brawn:2,agility:3,intellect:3,cunning:4,willpower:3,presence:3,
    soak:3,woundThreshold:12,
    defense:{ranged:0,melee:0},
    skills:[{name:"Streetwise",rank:3},{name:"Deception",rank:3},{name:"Ranged (Light)",rank:2},{name:"Skullduggery",rank:3},{name:"Negotiation",rank:2},{name:"Stealth",rank:2},{name:"Survival",rank:2}],
    talents:[
      {name:"Black Market Contacts",desc:"Reduce rarity of any item by 1 for purchase purposes."},
      {name:"Convincing Demeanor",desc:"Remove one setback from Deception and Skullduggery checks."},
      {name:"Durable",desc:"Reduce Critical Injury result by 10."},
    ],
    weapons:[
      {name:"Blaster Pistol",damage:"6",critical:3,range:"Medium",qualities:"Stun Setting"},
      {name:"Vibroknife",damage:"Brawn+1 (3)",critical:2,range:"Engaged",qualities:"Pierce 2"},
    ],
    abilities:["Local Knowledge (Ryloth) — remove all setback dice from checks related to navigating or operating on Ryloth"],
    equipment:"Blaster pistol, vibroknife, cantina (asset), encrypted comlink, local contacts list",
    desc:"Mira has survived a decade on Ryloth by being smarter than everyone who wanted to use her. She's usually right. Not always.",
    hook:"Her double-dealing will surface. The PCs' response determines whether she becomes a loyal ally or a tragic casualty.",
  },
  yara:{
    name:"Dr. Yara Senn",type:"ALLY",species:"Mirialan",career:"Medic",
    brawn:2,agility:2,intellect:4,cunning:3,willpower:3,presence:3,
    soak:2,woundThreshold:12,
    defense:{ranged:0,melee:0},
    skills:[{name:"Medicine",rank:4},{name:"Knowledge (Xenobiology)",rank:3},{name:"Perception",rank:2},{name:"Ranged (Light)",rank:1},{name:"Computers",rank:2},{name:"Deception",rank:2}],
    talents:[
      {name:"Surgeon 3",desc:"When making Medicine checks to heal wounds, heal 3 additional wounds."},
      {name:"Stim Application 2",desc:"Twice per session, allow an ally to perform one additional maneuver without spending strain."},
      {name:"Bacta Specialist",desc:"Patients heal one additional wound per day under Yara's care."},
    ],
    weapons:[
      {name:"Hold-out Blaster",damage:"5",critical:4,range:"Short",qualities:"Stun Setting"},
    ],
    abilities:["Field Surgery — stabilise a dying character as an action (no check required) and restore them to 1 wound"],
    equipment:"Hold-out blaster, medpac x3, surgical tools (Enc 4), encrypted personal datapad, Imperial medical credentials (false)",
    desc:"Brilliant, sardonic, and impossible to intimidate once she's decided to help you. Don't question her methods. They work.",
    hook:"Her Imperial contact who supplies stolen bacta will eventually need a favour that complicates the cell's operations.",
  },
  lira:{
    name:"Lira Tessek",type:"ALLY",species:"Human",career:"Logistics / Quartermaster",
    brawn:2,agility:3,intellect:3,cunning:3,willpower:3,presence:4,
    soak:2,woundThreshold:11,
    defense:{ranged:0,melee:0},
    skills:[{name:"Negotiation",rank:3},{name:"Leadership",rank:2},{name:"Cool",rank:3},{name:"Charm",rank:3},{name:"Computers",rank:2},{name:"Ranged (Light)",rank:1}],
    talents:[
      {name:"Smooth Talker (Negotiation)",desc:"Once per session, make a Negotiation check as if it were 1 difficulty easier."},
      {name:"Inspiring Rhetoric",desc:"Once per encounter, allies within short range recover 2 strain."},
    ],
    weapons:[
      {name:"Blaster Pistol",damage:"6",critical:3,range:"Medium",qualities:"Stun Setting"},
    ],
    abilities:["Quartermaster — once per session, produce any common piece of equipment (Rarity 4 or less) from base supplies"],
    equipment:"Blaster pistol, encrypted comlink, inventory datapad, personal comm (with unread message from Admiral's aide)",
    desc:"Warm, efficient, and carrying something she won't talk about. Lira holds the base together socially more than anyone realises.",
    hook:"The unread message. When she opens it, the campaign changes. The PCs may be in the room when it happens.",
  },
  sable:{
    name:"Sable (Kael Orun)",type:"RIVAL",species:"Human",career:"CorSec Officer / Operative",
    brawn:3,agility:3,intellect:3,cunning:4,willpower:3,presence:3,
    soak:4,woundThreshold:14,
    defense:{ranged:1,melee:1},
    skills:[{name:"Ranged (Light)",rank:3},{name:"Vigilance",rank:3},{name:"Perception",rank:3},{name:"Deception",rank:3},{name:"Skullduggery",rank:2},{name:"Streetwise",rank:2},{name:"Brawl",rank:2}],
    talents:[
      {name:"Adversary 1",desc:"Upgrade the difficulty of all combat checks targeting this character once."},
      {name:"Point Blank",desc:"Add one damage per rank to Ranged attacks while within short range."},
      {name:"Quick Draw",desc:"Draw or holster a weapon or accessible item as an incidental."},
    ],
    weapons:[
      {name:"CorSec Blaster Pistol (modified)",damage:"7",critical:3,range:"Medium",qualities:"Accurate 1, Stun Setting"},
      {name:"Stun Baton",damage:"Brawn+2 (5)",critical:5,range:"Engaged",qualities:"Disorient 2, Stun 3"},
    ],
    abilities:["Undercover Protocol — when operating non-combat, add two boost dice to all Deception checks"],
    equipment:"Modified blaster pistol, stun baton, CorSec badge (real), Rebel contact codes (encrypted), light armour (Soak +1, Def +1)",
    desc:"Sable operates in the space between identities. Neither fully CorSec nor fully Rebel, they survive by being exactly what each side expects.",
    hook:"The ISB informant inside CorSec is running out of patience. The race to neutralise them is measured in days, not weeks.",
  },
  nunnb:{
    name:"Nien Nunb",type:"ALLY",species:"Sullustan",career:"Pilot / Resistance Coordinator",
    brawn:2,agility:4,intellect:3,cunning:3,willpower:3,presence:3,
    soak:3,woundThreshold:12,
    defense:{ranged:0,melee:0},
    skills:[{name:"Piloting (Space)",rank:4},{name:"Astrogation",rank:3},{name:"Mechanics",rank:3},{name:"Streetwise",rank:3},{name:"Ranged (Light)",rank:2},{name:"Cool",rank:3}],
    talents:[
      {name:"Galaxy Mapper",desc:"Remove one setback die from Astrogation checks. Once per session, astrogation checks take half normal time."},
      {name:"Skilled Jockey 2",desc:"Remove two setback dice from Piloting checks."},
      {name:"Full Throttle",desc:"Once per round, may take Full Throttle action to increase vehicle speed by 1 (Hard Piloting check)."},
    ],
    weapons:[
      {name:"Blaster Pistol",damage:"6",critical:3,range:"Medium",qualities:"Stun Setting"},
    ],
    abilities:["Underground Network — move personnel or goods through Sullust without a trace; eliminate 1 Heat gained on Sullust once per session"],
    equipment:"Blaster pistol, flight suit, encrypted comlink, SoroSuub worker ID (genuine), network contact codes",
    desc:"Nien Nunb laughs first and shoots second. Don't mistake the laughter for lack of seriousness. He has held this network together for two years without a single betrayal.",
    hook:"The sensor component sabotage. If the PCs execute it well, Nien becomes one of the campaign's most reliable logistical assets.",
  },
  drax:{
    name:"Drax Solenne",type:"RIVAL",species:"Mirialan",career:"Scavenger / Lieutenant",
    brawn:3,agility:3,intellect:4,cunning:3,willpower:2,presence:2,
    soak:4,woundThreshold:13,
    defense:{ranged:0,melee:0},
    skills:[{name:"Mechanics",rank:4},{name:"Computers",rank:3},{name:"Ranged (Light)",rank:2},{name:"Skullduggery",rank:3},{name:"Perception",rank:2},{name:"Brawl",rank:2}],
    talents:[
      {name:"Gearhead",desc:"Remove one setback die from Mechanics checks. Reduce time for mechanical work by 25%."},
      {name:"Jury Rigged",desc:"Choose one weapon or equipment piece; reduce its encumbrance by 1 and increase its critical rating by 1."},
    ],
    weapons:[
      {name:"Blaster Pistol",damage:"6",critical:3,range:"Medium",qualities:"Stun Setting"},
      {name:"Sawed-off Scattergun",damage:"8",critical:3,range:"Short",qualities:"Blast 6, Knockdown, Limited Ammo 2"},
    ],
    abilities:["Salvage Expert — may identify value or function of any salvage item without a check"],
    equipment:"Blaster pistol, scattergun, mechanics tools, armoured jacket (Soak +1), encrypted accounting records (evidence of skimming)",
    desc:"Drax is good at two things: understanding machines and keeping secrets. One of those is about to cause him serious problems.",
    hook:"His skimming operation. He will kill to keep it secret. Hold it over him rather than reporting it and he becomes a frightened but useful inside contact at Reaper's Drift.",
  },
  kelvane:{
    name:"Boss Kel Vane",type:"RIVAL",species:"Devaronian",career:"Pirate Lord",
    brawn:4,agility:3,intellect:2,cunning:4,willpower:3,presence:4,
    soak:5,woundThreshold:16,
    defense:{ranged:1,melee:1},
    skills:[{name:"Coercion",rank:3},{name:"Brawl",rank:3},{name:"Ranged (Light)",rank:2},{name:"Melee",rank:2},{name:"Leadership",rank:3},{name:"Negotiation",rank:2},{name:"Vigilance",rank:2}],
    talents:[
      {name:"Adversary 1",desc:"Upgrade the difficulty of all combat checks targeting this character once."},
      {name:"Intimidating",desc:"May use Coercion instead of Presence for social checks when fear is a factor."},
      {name:"Quick Strike",desc:"Add one boost die to combat checks against targets that have not yet acted this round."},
    ],
    weapons:[
      {name:"Heavy Blaster Pistol",damage:"7",critical:3,range:"Medium",qualities:"Stun Setting"},
      {name:"Vibro-Axe",damage:"Brawn+3 (7)",critical:2,range:"Engaged",qualities:"Pierce 2, Sunder, Vicious 3"},
    ],
    abilities:["Never Alone — always accompanied by 1d3 pirate bodyguards (Rival-grade) when encountered in Reaper's Drift"],
    equipment:"Heavy blaster pistol, vibro-axe, armoured coat (Soak +1, Def +1), encrypted financial records, communication codes",
    desc:"Kel Vane rules Reaper's Drift through the oldest law in the galaxy: I'm bigger than you and I remember everything.",
    hook:"The Imperial encryption hardware. He'll sell it to whoever impresses him most — credits, reputation, or sheer audacity.",
  },
  stormtrooper:{
    name:"Imperial Stormtrooper",type:"MINION",species:"Human",career:"Imperial Soldier",
    brawn:3,agility:3,intellect:2,cunning:2,willpower:2,presence:2,
    soak:5,woundThreshold:5,
    defense:{ranged:1,melee:1},
    skills:[{name:"Ranged (Heavy)",rank:1},{name:"Brawl",rank:1},{name:"Vigilance",rank:1}],
    talents:[],
    weapons:[
      {name:"E-11 Blaster Rifle",damage:"9",critical:3,range:"Medium",qualities:"Stun Setting"},
      {name:"Brawl",damage:"Brawn+0 (3)",critical:5,range:"Engaged",qualities:""},
    ],
    abilities:["Standard Imperial training — operates as minion group (skills combine when grouped)"],
    equipment:"E-11 blaster rifle, stormtrooper armour (Soak +2, Def +1), comlink, 2 stun grenades",
    desc:"The Empire's rank-and-file. Individually competent; in groups, a serious threat.",
    hook:"Stormtroopers have call codes. Capturing one provides codes that allow 24 hours of impersonation before the codes cycle.",
  },
  navalofficer:{
    name:"Imperial Naval Officer",type:"MINION",species:"Human",career:"Imperial Officer",
    brawn:2,agility:2,intellect:3,cunning:3,willpower:3,presence:3,
    soak:2,woundThreshold:4,
    defense:{ranged:0,melee:0},
    skills:[{name:"Ranged (Light)",rank:1},{name:"Leadership",rank:1},{name:"Discipline",rank:1}],
    talents:[],
    weapons:[
      {name:"Blaster Pistol",damage:"6",critical:3,range:"Medium",qualities:"Stun Setting"},
    ],
    abilities:["Command — while alive, all Stormtrooper minion groups within medium range add one boost die to combat checks"],
    equipment:"Blaster pistol, Imperial uniform, datapad, access codes (level dependent on rank)",
    desc:"Officers range from competent bureaucrats to dangerous tactical minds. Assume the worst.",
    hook:"Their access codes are always the most valuable thing they carry.",
  },
  lazarus:{
    name:"LAZARUS Clone (LZ-9)",type:"RIVAL",species:"Human (Clone)",career:"Special Operations",
    brawn:4,agility:4,intellect:3,cunning:3,willpower:3,presence:2,
    soak:5,woundThreshold:15,
    defense:{ranged:1,melee:1},
    skills:[{name:"Ranged (Heavy)",rank:3},{name:"Brawl",rank:3},{name:"Athletics",rank:3},{name:"Stealth",rank:2},{name:"Vigilance",rank:3},{name:"Resilience",rank:2}],
    talents:[
      {name:"Adversary 1",desc:"Upgrade the difficulty of all combat checks targeting this character once."},
      {name:"Lethal Blows",desc:"Add +10 per rank to Critical Injury results inflicted on opponents."},
      {name:"Conditioning",desc:"Remove one setback from Resilience and Athletics checks."},
    ],
    weapons:[
      {name:"Dual Blaster Pistols",damage:"6 each",critical:3,range:"Medium",qualities:"Paired, Stun Setting"},
      {name:"Combat Knife",damage:"Brawn+1 (5)",critical:3,range:"Engaged",qualities:"Pierce 1"},
    ],
    abilities:["Enhanced Physiology — reduce Critical Injury result by 10","LAZARUS Protocol — if defeated, may be reactivated remotely (GM discretion — creates scenario hook)"],
    equipment:"Dual blaster pistols, combat knife, heavy armour (Soak +1, Def +1), encrypted mission datapad, tracking implant",
    desc:"LAZARUS clones are a rumoured Imperial special operations project — enhanced soldiers conditioned for high-value target elimination. LZ-9 has been tasked with something. The PCs don't know what. Yet.",
    hook:"LZ-9 is following one of the PCs specifically. His mission parameters are classified even within the Imperial system. He will not explain himself. He will complete his objective.",
  },
}

export const DIE_FACES: Record<string,any[][]> = {
  ability:     [[],[],[{s:1}],[{s:1}],[{s:2}],[{a:1}],[{s:1,a:1}],[{a:2}]],
  proficiency: [[],[{s:1}],[{s:1}],[{s:2}],[{s:2}],[{a:1}],[{s:1,a:1}],[{s:1,a:1}],[{s:1,a:1}],[{s:2,a:1}],[{a:2}],[{t:1}]],
  difficulty:  [[],[{f:1}],[{f:2}],[{th:1}],[{th:1}],[{th:1}],[{th:2}],[{f:1,th:1}]],
  challenge:   [[],[{f:1}],[{f:1}],[{f:2}],[{f:2}],[{th:1}],[{th:1}],[{f:1,th:1}],[{f:1,th:1}],[{f:2,th:1}],[{th:2}],[{d:1}]],
  boost:       [[],[],[{s:1}],[{s:1,a:1}],[{a:2}],[{a:1}]],
  setback:     [[],[],[{f:1}],[{f:1}],[{th:1}],[{th:1}]],
}
