'use client'
import { useState, useEffect, useRef } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const CHAR_COLORS = ['#2E86C1','#1E8449','#C0392B','#6C3483','#D4AC0D','#E67E22','#17A589']

const SKILL_CHAR: Record<string,string> = {
  'Astrogation':'Int','Athletics':'Br','Brawl':'Br','Charm':'Pr','Coercion':'Wi',
  'Computers':'Int','Cool':'Pr','Coordination':'Ag','Deception':'Cu','Discipline':'Wi',
  'Gunnery':'Ag','Leadership':'Pr','Lightsaber':'Br','Mechanics':'Int','Medicine':'Int','Melee':'Br',
  'Perception':'Cu','Piloting (Planetary)':'Ag','Piloting (Space)':'Ag',
  'Ranged (Heavy)':'Ag','Ranged (Light)':'Ag','Resilience':'Br','Skulduggery':'Cu',
  'Stealth':'Ag','Streetwise':'Cu','Survival':'Cu','Vigilance':'Wi',
}
// Ordered list of characteristic abbreviations used to cycle skill links
const CHAR_ABBR_CYCLE = ['Br','Ag','Int','Cu','Wi','Pr']

const CHAR_ABBR: Record<string,string> = {
  Brawn:'Br',Agility:'Ag',Intellect:'Int',Cunning:'Cu',Willpower:'Wi',Presence:'Pr'
}
const CHAR_KEYS = ['Brawn','Agility','Intellect','Cunning','Willpower','Presence']

const DEFAULT_SKILLS = Object.fromEntries(Object.keys(SKILL_CHAR).map(k=>[k,0]))

const DEFAULT_CHAR = {
  id:'', name:'New Character', player:'', species:'', career:'', specialisation:'',
  colorIdx:0,
  characteristics:{Brawn:2,Agility:2,Intellect:2,Cunning:2,Willpower:2,Presence:2},
  wounds:0, woundThreshold:12, strain:0, strainThreshold:12,
  soak:2, defense:0, forceRating:0, duty:0, dutyType:'', morality:50,
  skills:{...DEFAULT_SKILLS},
  talents:[] as any[], weapons:[] as any[], equipment:[] as any[],
  notes:'', xp:0, totalXp:0,
}

const INITIAL_CAMPAIGN = {
  session:1, heatLevel:0, renausTrack:0, mercyCount:0, expedCount:0,
  ht:0, sst:0, stealthActive:false,
  missionStatus:{} as Record<string,string>,
  shipUpgrades:{} as Record<string,boolean>,
  gmNotes:'',
  duty:0, tier:1,
  crewCriticals:[] as any[],
  shipCriticals:[] as any[],
}

const MISSIONS = [
  {id:'m11',name:'1-1  Dark Cargo',         act:'I',  duty:'5+',  sessions:1},
  {id:'m12',name:'1-2  Ghost Light',         act:'I',  duty:'8',   sessions:1},
  {id:'m13',name:'1-3  Cold Extraction',     act:'I',  duty:'10+', sessions:2},
  {id:'m21',name:'2-1  The Hammer Falls',    act:'II', duty:'15+', sessions:2},
  {id:'m22',name:'2-2  Deep Water',          act:'II', duty:'12+', sessions:2},
  {id:'m23',name:'2-3  Signal in the Dark',  act:'II', duty:'20',  sessions:1},
  {id:'m3f',name:'3-F  Installation Omega',  act:'III',duty:'50',  sessions:4},
]

const SHIP_UPGRADES = [
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

// ─────────────────────────────────────────────────────────────────────────────
// CRITICAL INJURY / VEHICLE CRITICAL HIT TABLES
// ─────────────────────────────────────────────────────────────────────────────
const CREW_CRIT: {lo:number,hi:number,sev:number,name:string,eff:string}[] = [
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

const SHIP_CRIT: {lo:number,hi:number,sev:number,name:string,eff:string}[] = [
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

// ─────────────────────────────────────────────────────────────────────────────
// SHIP DOSSIER  (19 vessels)
// ─────────────────────────────────────────────────────────────────────────────
const SHIP_STATS: Record<string,{
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

const SHIP_CATEGORIES = ['ALL','PLAYER SHIP','CAPITAL SHIP','PATROL / CORVETTE','STARFIGHTER','BOMBER','ASSAULT GUNSHIP','TRANSPORT','REBEL VESSEL','CIVILIAN / NEUTRAL']

const LOCATIONS = [
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

const LANES = [
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

const TYPE_META: Record<string,{color:string,label:string}> = {
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

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION DATA  (sourced from location_guide.pdf)
// ─────────────────────────────────────────────────────────────────────────────
const LOCATION_DATA: Record<string,{
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

// ─────────────────────────────────────────────────────────────────────────────
// NPC STAT BLOCKS  (sourced from npc_dossier.pdf)
// ─────────────────────────────────────────────────────────────────────────────
const NPC_STATS: Record<string,{
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

// ─────────────────────────────────────────────────────────────────────────────
// DICE ENGINE
// ─────────────────────────────────────────────────────────────────────────────
const DIE_FACES: Record<string,any[][]> = {
  ability:     [[],[],[{s:1}],[{s:1}],[{s:2}],[{a:1}],[{s:1,a:1}],[{a:2}]],
  proficiency: [[],[{s:1}],[{s:1}],[{s:2}],[{s:2}],[{a:1}],[{s:1,a:1}],[{s:1,a:1}],[{s:1,a:1}],[{s:2,a:1}],[{a:2}],[{t:1}]],
  difficulty:  [[],[{f:1}],[{f:2}],[{th:1}],[{th:1}],[{th:1}],[{th:2}],[{f:1,th:1}]],
  challenge:   [[],[{f:1}],[{f:1}],[{f:2}],[{f:2}],[{th:1}],[{th:1}],[{f:1,th:1}],[{f:1,th:1}],[{f:2,th:1}],[{th:2}],[{d:1}]],
  boost:       [[],[],[{s:1}],[{s:1,a:1}],[{a:2}],[{a:1}]],
  setback:     [[],[],[{f:1}],[{f:1}],[{th:1}],[{th:1}]],
}

function rollDice(pool: Record<string,number>) {
  const tot: Record<string,number> = {s:0,f:0,a:0,th:0,t:0,d:0}
  Object.entries(pool).forEach(([type,count]) => {
    const faces = DIE_FACES[type]; if (!faces || !count) return
    for (let i=0;i<count;i++) {
      const face = faces[Math.floor(Math.random()*faces.length)] || []
      face.forEach((r:any) => Object.entries(r).forEach(([k,v]:any) => tot[k]=(tot[k]||0)+v))
    }
  })
  return {
    s:  Math.max(0,tot.s-tot.f),
    f:  Math.max(0,tot.f-tot.s),
    a:  Math.max(0,tot.a-tot.th),
    th: Math.max(0,tot.th-tot.a),
    t:  tot.t, d: tot.d,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API HELPERS
// ─────────────────────────────────────────────────────────────────────────────
async function api(path: string, method='GET', body?: any) {
  const res = await fetch(path, {
    method,
    headers: body ? {'Content-Type':'application/json'} : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${method} ${path} → ${res.status}: ${text}`)
  }
  return res.json()
}

// Debounce hook — delays saving until the user stops typing
function useDebounce<T>(value: T, delay=900): T {
  const [dv, setDv] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return dv
}

function useIsMobile(breakpoint=768) {
  const [m, setM] = useState(false)
  useEffect(() => {
    const check = () => setM(window.innerWidth <= breakpoint)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])
  return m
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL SHARED UI PIECES
// ─────────────────────────────────────────────────────────────────────────────
function SBtn({ onClick, children, title }: { onClick:()=>void; children:React.ReactNode; title?:string }) {
  return (
    <button
      onClick={onClick} title={title}
      style={{width:20,height:20,borderRadius:'50%',border:'1px solid var(--border)',background:'none',
              color:'var(--text-dim)',fontSize:17,display:'inline-flex',alignItems:'center',
              justifyContent:'center',transition:'all 0.15s'}}
    >{children}</button>
  )
}

function Btn({ onClick, children, variant='default', style={} }:
  { onClick:()=>void; children:React.ReactNode; variant?:string; style?:any }) {
  const v: Record<string,any> = {
    default: {background:'var(--panel)',border:'1px solid var(--border2)',color:'var(--text)'},
    primary: {background:'rgba(212,172,13,0.15)',border:'1px solid rgba(212,172,13,0.5)',color:'var(--gold)'},
    success: {background:'rgba(30,132,73,0.15)',border:'1px solid rgba(30,132,73,0.4)',color:'var(--green-bright)'},
    danger:  {background:'rgba(192,57,43,0.15)',border:'1px solid rgba(192,57,43,0.4)',color:'var(--red)'},
  }
  return (
    <button onClick={onClick}
      style={{padding:'8px 16px',borderRadius:6,fontFamily:'var(--display)',fontSize:15,fontWeight:600,
              letterSpacing:'0.06em',textTransform:'uppercase',...v[variant],...style}}
    >{children}</button>
  )
}

function CardSection({ title, children }: { title:string; children:React.ReactNode }) {
  return (
    <div style={{marginBottom:16}}>
      <div style={{fontFamily:'var(--display)',fontSize:15,fontWeight:700,letterSpacing:'0.12em',
                   textTransform:'uppercase',color:'var(--gold)',marginBottom:10,paddingBottom:6,
                   borderBottom:'1px solid rgba(212,172,13,0.3)'}}>{title}</div>
      {children}
    </div>
  )
}

function GmCard({ title, children, col=1 }: { title:string; children:React.ReactNode; col?:number }) {
  return (
    <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8,
                 padding:16,gridColumn:`span ${col}`}}>
      <div style={{fontFamily:'var(--display)',fontSize:15,fontWeight:700,letterSpacing:'0.12em',
                   textTransform:'uppercase',color:'var(--gold)',marginBottom:14,paddingBottom:8,
                   borderBottom:'1px solid rgba(212,172,13,0.3)'}}>{title}</div>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT BLOCK COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function StatBlock({ npcKey, isGm }: { npcKey: string; isGm: boolean }) {
  const npc = NPC_STATS[npcKey]
  if (!npc) return null
  const typeColor = npc.type==='NEMESIS'?'#7b1fa2':npc.type==='RIVAL'?'#1565c0':npc.type==='ALLY'?'#2e7d32':'#5d4037'
  const typeBg   = npc.type==='NEMESIS'?'rgba(123,31,162,0.12)':npc.type==='RIVAL'?'rgba(21,101,192,0.12)':npc.type==='ALLY'?'rgba(46,125,50,0.12)':'rgba(93,64,55,0.12)'
  const charVals = [npc.brawn,npc.agility,npc.intellect,npc.cunning,npc.willpower,npc.presence]
  const charLabels = ['Brawn','Agility','Intellect','Cunning','Willpower','Presence']
  return (
    <div style={{background:'var(--panel)',border:`2px solid ${typeColor}`,borderRadius:8,overflow:'hidden',marginBottom:12}}>
      <div style={{background:typeColor,padding:'8px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
        <div>
          <div style={{fontFamily:'var(--display)',fontWeight:700,fontSize:18,color:'#fff'}}>{npc.name}</div>
          <div style={{fontSize:15,color:'rgba(255,255,255,0.75)',fontFamily:'var(--mono)',letterSpacing:'0.08em'}}>{npc.species} · {npc.career}</div>
        </div>
        <div style={{background:'rgba(255,255,255,0.18)',borderRadius:4,padding:'2px 8px',fontFamily:'var(--mono)',fontSize:15,fontWeight:700,color:'#fff',flexShrink:0}}>{npc.type}</div>
      </div>
      {/* Characteristics */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:1,background:'var(--border)'}}>
        {charLabels.map((c,i)=>(
          <div key={c} style={{background:typeBg,padding:'5px 2px',textAlign:'center'}}>
            <div style={{fontSize:13,fontFamily:'var(--mono)',color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.04em'}}>{c.slice(0,3)}</div>
            <div style={{fontSize:23,fontWeight:700,fontFamily:'var(--display)',color:typeColor,lineHeight:1.1}}>{charVals[i]}</div>
          </div>
        ))}
      </div>
      {/* Derived stats */}
      <div style={{display:'flex',gap:10,padding:'7px 12px',flexWrap:'wrap',borderBottom:'1px solid var(--border)'}}>
        {[
          {l:'Soak', v:npc.soak},{l:'Wounds',v:npc.woundThreshold},
          ...(npc.strainThreshold!=null?[{l:'Strain',v:npc.strainThreshold}]:[]),
          {l:'Def R',v:npc.defense.ranged},{l:'Def M',v:npc.defense.melee},
          ...(npc.forceRating?[{l:'Force',v:npc.forceRating}]:[]),
          ...(npc.adversary?[{l:'Adv',v:npc.adversary}]:[]),
        ].map(s=>(
          <div key={s.l} style={{textAlign:'center',minWidth:32}}>
            <div style={{fontSize:13,fontFamily:'var(--mono)',color:'var(--text-dim)',textTransform:'uppercase'}}>{s.l}</div>
            <div style={{fontSize:18,fontWeight:700,color:'var(--text-bright)',fontFamily:'var(--display)'}}>{s.v}</div>
          </div>
        ))}
      </div>
      {/* Skills */}
      <div style={{padding:'5px 12px',borderBottom:'1px solid var(--border)'}}>
        <div style={{fontSize:14,fontFamily:'var(--mono)',fontWeight:700,color:typeColor,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.08em'}}>Skills</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
          {npc.skills.map(s=>(
            <span key={s.name} style={{fontFamily:'var(--mono)',fontSize:15,background:'rgba(255,255,255,0.05)',borderRadius:3,padding:'1px 5px',color:'var(--text-dim)'}}>
              {s.name} {s.rank}
            </span>
          ))}
        </div>
      </div>
      {/* Weapons */}
      <div style={{padding:'5px 12px',borderBottom:'1px solid var(--border)'}}>
        <div style={{fontSize:14,fontFamily:'var(--mono)',fontWeight:700,color:typeColor,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.08em'}}>Weapons</div>
        {npc.weapons.map(w=>(
          <div key={w.name} style={{fontSize:15,fontFamily:'var(--mono)',color:'var(--text-dim)',marginBottom:2,lineHeight:1.4}}>
            <span style={{color:'var(--text-bright)'}}>{w.name}</span>
            {' — '}Dmg {w.damage} | Crit {w.critical} | {w.range}{w.qualities?` | ${w.qualities}`:''}
          </div>
        ))}
      </div>
      {/* Talents */}
      {npc.talents.length>0 && (
        <div style={{padding:'5px 12px',borderBottom:'1px solid var(--border)'}}>
          <div style={{fontSize:14,fontFamily:'var(--mono)',fontWeight:700,color:typeColor,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.08em'}}>Talents & Special Abilities</div>
          {[...npc.talents.map(t=>({name:t.name,desc:t.desc})),...npc.abilities.map(a=>({name:'',desc:a}))].map((t,i)=>(
            <div key={i} style={{fontSize:15,fontFamily:'var(--mono)',color:'var(--text-dim)',marginBottom:2,lineHeight:1.4}}>
              {t.name&&<span style={{color:'var(--text-bright)'}}>{t.name}: </span>}{t.desc}
            </div>
          ))}
        </div>
      )}
      {/* Equipment */}
      <div style={{padding:'5px 12px',borderBottom:'1px solid var(--border)'}}>
        <div style={{fontSize:14,fontFamily:'var(--mono)',fontWeight:700,color:typeColor,marginBottom:2,textTransform:'uppercase',letterSpacing:'0.08em'}}>Equipment</div>
        <div style={{fontSize:15,fontFamily:'var(--mono)',color:'var(--text-dim)',lineHeight:1.4}}>{npc.equipment}</div>
      </div>
      {/* Description */}
      <div style={{padding:'7px 12px',borderBottom:isGm?'1px solid var(--border)':'none'}}>
        <div style={{fontSize:16,color:'var(--text-dim)',lineHeight:1.55}}>{npc.desc}</div>
      </div>
      {/* GM Hook */}
      {isGm && (
        <div style={{padding:'7px 12px',background:'rgba(212,172,13,0.07)',borderTop:'1px solid rgba(212,172,13,0.25)'}}>
          <div style={{fontSize:14,fontFamily:'var(--mono)',fontWeight:700,color:'var(--gold)',marginBottom:3,textTransform:'uppercase',letterSpacing:'0.08em'}}>GM Hook</div>
          <div style={{fontSize:15,color:'rgba(212,172,13,0.85)',lineHeight:1.55}}>{npc.hook}</div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION MODAL
// ─────────────────────────────────────────────────────────────────────────────
function LocationModal({ locId, isGm, onClose }: { locId: string; isGm: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('overview')
  const data = LOCATION_DATA[locId]
  const loc  = LOCATIONS.find(l => l.id === locId)
  if (!loc) return null
  const typeColor = TYPE_META[loc.type]?.color || '#ffa726'

  if (!data) {
    return (
      <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={onClose}>
        <div style={{background:'var(--bg2)',border:`1px solid ${typeColor}`,borderRadius:8,padding:24,maxWidth:480,width:'92%'}} onClick={e=>e.stopPropagation()}>
          <div style={{fontFamily:'var(--display)',fontSize:21,color:typeColor,marginBottom:8}}>{loc.name}</div>
          <div style={{color:'var(--text-dim)',fontSize:15,lineHeight:1.6,marginBottom:16}}>{loc.desc}</div>
          <button onClick={onClose} style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:4,padding:'4px 16px',color:'var(--text-dim)',cursor:'pointer',fontFamily:'var(--display)',fontSize:15,fontWeight:600}}>Close</button>
        </div>
      </div>
    )
  }

  const tabs = [
    {id:'overview',label:'Overview'},
    ...(data.poi.length         ? [{id:'poi',   label:'Points of Interest'}] : []),
    ...(data.shops.length       ? [{id:'shops', label:'Shops & Services'}]   : []),
    ...(isGm && data.npcs.length   ? [{id:'npcs',  label:'People'}]    : []),
    ...(isGm && data.quests.length ? [{id:'quests',label:'Missions'}]  : []),
    ...(isGm && data.dmNotes    ? [{id:'dm',    label:'⚙ DM Notes'}]         : []),
  ]

  return (
    <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'28px 12px',overflowY:'auto'}} onClick={onClose}>
      <div style={{background:'var(--bg2)',border:`1px solid ${typeColor}`,borderRadius:8,width:'min(860px,98vw)',display:'flex',flexDirection:'column',maxHeight:'calc(100vh - 56px)',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{borderBottom:`2px solid ${typeColor}`,padding:'14px 18px',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
          <div style={{flex:1}}>
            <div style={{fontFamily:'var(--display)',fontWeight:700,fontSize:23,color:typeColor,letterSpacing:'0.05em'}}>{loc.name}</div>
            <div style={{fontSize:15,fontFamily:'var(--mono)',color:'var(--text-dim)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:2}}>
              {TYPE_META[loc.type]?.label}
              {loc.ly   ? `  ·  ${loc.ly} ly from base` : ''}
              {loc.threat ? `  ·  ${loc.threat}` : ''}
            </div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'1px solid var(--border)',borderRadius:4,color:'var(--text-dim)',fontSize:21,lineHeight:1,cursor:'pointer',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>×</button>
        </div>
        {/* Tabs */}
        <div style={{display:'flex',borderBottom:'1px solid var(--border)',flexShrink:0,overflowX:'auto'}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              style={{padding:'9px 15px',border:'none',background:'none',cursor:'pointer',
                     fontFamily:'var(--display)',fontSize:15,fontWeight:600,letterSpacing:'0.06em',
                     color:activeTab===t.id?typeColor:'var(--text-dim)',
                     borderBottom:activeTab===t.id?`2px solid ${typeColor}`:'2px solid transparent',
                     whiteSpace:'nowrap',transition:'color 0.15s'}}>
              {t.label}
            </button>
          ))}
        </div>
        {/* Content */}
        <div style={{flex:1,overflowY:'auto',padding:18}}>
          {activeTab==='overview' && (
            <div>
              <p style={{fontSize:16,color:'var(--text-bright)',lineHeight:1.75,marginBottom:14}}>{data.overview}</p>
              <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)',borderRadius:6,padding:12}}>
                <div style={{fontSize:14,fontFamily:'var(--mono)',fontWeight:700,color:typeColor,marginBottom:5,textTransform:'uppercase',letterSpacing:'0.08em'}}>Atmosphere</div>
                <p style={{fontSize:15,color:'var(--text-dim)',lineHeight:1.65,fontStyle:'italic',margin:0}}>{data.atmosphere}</p>
              </div>
            </div>
          )}
          {activeTab==='poi' && (
            <div>
              {data.poi.map(p=>(
                <div key={p.name} style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:12,marginBottom:10}}>
                  <div style={{fontFamily:'var(--display)',fontWeight:600,fontSize:16,color:typeColor,marginBottom:4}}>{p.name}</div>
                  <div style={{fontSize:15,color:'var(--text-dim)',lineHeight:1.55}}>{p.desc}</div>
                </div>
              ))}
            </div>
          )}
          {activeTab==='shops' && (
            <div>
              {data.shops.map(s=>(
                <div key={s.name} style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:12,marginBottom:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:4}}>
                    <div style={{fontFamily:'var(--display)',fontWeight:600,fontSize:16,color:typeColor}}>{s.name}</div>
                    <span style={{fontSize:14,fontFamily:'var(--mono)',letterSpacing:'0.08em',textTransform:'uppercase',background:'rgba(255,255,255,0.05)',borderRadius:3,padding:'2px 6px',color:'var(--text-dim)',flexShrink:0}}>{s.type}</span>
                  </div>
                  <div style={{fontSize:15,color:'var(--text-dim)',lineHeight:1.55,marginBottom:s.inventory?8:0}}>{s.desc}</div>
                  {s.inventory && (
                    <div style={{background:'rgba(0,0,0,0.25)',borderRadius:4,padding:'6px 10px'}}>
                      <div style={{fontSize:14,fontFamily:'var(--mono)',fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:3}}>Sample Inventory</div>
                      <div style={{fontSize:16,fontFamily:'var(--mono)',color:'var(--text-dim)',lineHeight:1.6}}>{s.inventory}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {activeTab==='npcs' && (
            <div>
              {data.npcs.map(n=>(
                <div key={n.key}>
                  {NPC_STATS[n.key] ? (
                    <StatBlock npcKey={n.key} isGm={isGm} />
                  ) : (
                    <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:12,marginBottom:12}}>
                      <div style={{fontFamily:'var(--display)',fontWeight:600,fontSize:16,color:typeColor,marginBottom:2}}>{n.name}</div>
                      <div style={{fontSize:15,fontFamily:'var(--mono)',color:'var(--text-dim)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.08em'}}>{n.role}</div>
                      <div style={{fontSize:15,color:'var(--text-dim)',lineHeight:1.55}}>{n.desc}</div>
                      {isGm && n.hook && (
                        <div style={{marginTop:8,padding:'6px 10px',background:'rgba(212,172,13,0.07)',borderRadius:4,borderTop:'1px solid rgba(212,172,13,0.25)'}}>
                          <div style={{fontSize:14,fontFamily:'var(--mono)',fontWeight:700,color:'var(--gold)',marginBottom:2,textTransform:'uppercase',letterSpacing:'0.08em'}}>GM Hook</div>
                          <div style={{fontSize:15,color:'rgba(212,172,13,0.85)',lineHeight:1.5}}>{n.hook}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {activeTab==='quests' && (
            <div>
              {data.quests.map(q=>(
                <div key={q.name} style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:12,marginBottom:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:5}}>
                    <div style={{fontFamily:'var(--display)',fontWeight:600,fontSize:16,color:typeColor}}>{q.name}</div>
                    <span style={{fontSize:14,fontFamily:'var(--mono)',letterSpacing:'0.08em',textTransform:'uppercase',background:'rgba(255,255,255,0.05)',borderRadius:3,padding:'2px 6px',color:'var(--text-dim)',flexShrink:0}}>{q.type}</span>
                  </div>
                  <div style={{fontSize:15,fontFamily:'var(--mono)',color:'var(--text-dim)',marginBottom:6}}>Difficulty: {q.difficulty} · Reward: {q.reward}</div>
                  <div style={{fontSize:15,color:'var(--text-dim)',lineHeight:1.55}}>{q.desc}</div>
                  {isGm && (
                    <div style={{marginTop:8,padding:'7px 10px',background:'rgba(212,172,13,0.07)',borderRadius:4,borderTop:'1px solid rgba(212,172,13,0.25)'}}>
                      <div style={{fontSize:14,fontFamily:'var(--mono)',fontWeight:700,color:'var(--gold)',marginBottom:3,textTransform:'uppercase',letterSpacing:'0.08em'}}>GM Hook</div>
                      <div style={{fontSize:15,color:'rgba(212,172,13,0.85)',lineHeight:1.55}}>{q.gmHook}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {activeTab==='dm' && isGm && data.dmNotes && (
            <div style={{background:'rgba(212,172,13,0.07)',border:'1px solid rgba(212,172,13,0.3)',borderRadius:6,padding:16}}>
              <div style={{fontSize:14,fontFamily:'var(--mono)',fontWeight:700,color:'var(--gold)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.08em'}}>DM Notes — {loc.name}</div>
              <div style={{fontSize:15,color:'rgba(212,172,13,0.88)',lineHeight:1.75}}>{data.dmNotes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ADVERSARIES VIEW (GM only)
// ─────────────────────────────────────────────────────────────────────────────
function AdversariesView() {
  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [selectedKey, setSelectedKey] = useState<string|null>(null)

  const filtered = Object.entries(NPC_STATS).filter(([,npc]) => {
    const matchSearch = !search || npc.name.toLowerCase().includes(search.toLowerCase()) || npc.career.toLowerCase().includes(search.toLowerCase())
    const matchType   = typeFilter==='ALL' || npc.type===typeFilter
    return matchSearch && matchType
  })

  const typeColor = (t:string) => t==='NEMESIS'?'#7b1fa2':t==='RIVAL'?'#1565c0':t==='ALLY'?'#2e7d32':'#5d4037'

  return (
    <div style={{height:'100%',display:'flex',overflow:'hidden'}}>

      {/* ── Left panel: search + list ── */}
      <div style={{width:270,flexShrink:0,display:'flex',flexDirection:'column',
                   borderRight:'1px solid var(--border)',background:'var(--bg2)'}}>
        {/* Header */}
        <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
          <div style={{fontFamily:'var(--display)',fontWeight:700,fontSize:17,
                       letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gold)',marginBottom:8}}>
            Adversaries
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
            style={{width:'100%',background:'var(--panel)',border:'1px solid var(--border)',borderRadius:4,
                    padding:'5px 10px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:16,
                    outline:'none',boxSizing:'border-box'}}/>
          <div style={{display:'flex',gap:3,flexWrap:'wrap',marginTop:8}}>
            {(['ALL','NEMESIS','RIVAL','ALLY','MINION'] as const).map(t=>(
              <button key={t} onClick={()=>setTypeFilter(t)}
                style={{padding:'2px 7px',borderRadius:4,cursor:'pointer',fontFamily:'var(--mono)',fontSize:14,fontWeight:700,
                       border:`1px solid ${typeFilter===t?'rgba(212,172,13,0.5)':'var(--border)'}`,
                       background:typeFilter===t?'rgba(212,172,13,0.1)':'var(--panel)',
                       color:typeFilter===t?'var(--gold)':'var(--text-dim)'}}>
                {t}
              </button>
            ))}
          </div>
        </div>
        {/* Name list */}
        <div style={{flex:1,overflowY:'auto'}}>
          {filtered.length===0 && (
            <div style={{color:'var(--text-dim)',fontFamily:'var(--mono)',fontSize:16,textAlign:'center',paddingTop:32}}>
              No matches
            </div>
          )}
          {filtered.map(([key,npc])=>(
            <div key={key} onClick={()=>setSelectedKey(key===selectedKey?null:key)}
              style={{padding:'9px 14px',cursor:'pointer',borderBottom:'1px solid rgba(255,255,255,0.04)',
                      background:selectedKey===key?'rgba(212,172,13,0.08)':'transparent',
                      borderLeft:`3px solid ${selectedKey===key?typeColor(npc.type):'transparent'}`,
                      transition:'all 0.15s'}}>
              <div style={{fontFamily:'var(--display)',fontWeight:600,fontSize:15,
                           color:selectedKey===key?'var(--text-bright)':'var(--text)',marginBottom:2}}>
                {npc.name}
              </div>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <span style={{fontFamily:'var(--mono)',fontSize:13,fontWeight:700,
                              color:typeColor(npc.type),letterSpacing:'0.06em'}}>{npc.type}</span>
                <span style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--text-dim)'}}>·</span>
                <span style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--text-dim)'}}>{npc.species}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel: stat block detail ── */}
      <div style={{flex:1,overflowY:'auto',padding:20,background:'var(--bg)'}}>
        {selectedKey ? (
          <StatBlock npcKey={selectedKey} isGm={true}/>
        ) : (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                       height:'100%',gap:12,color:'var(--text-dim)'}}>
            <div style={{fontSize:36,opacity:0.3}}>⚔</div>
            <div style={{fontFamily:'var(--mono)',fontSize:16,textAlign:'center'}}>
              Select an adversary from the list to view their stat block.
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GALAXY MAP
// ─────────────────────────────────────────────────────────────────────────────
function GalaxyMap({ showHidden, isGm }: { showHidden: boolean; isGm: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selected, setSelected]     = useState<string|null>(null)
  const [hover, setHover]           = useState<string|null>(null)
  const [pan, setPan]               = useState({x:0,y:0})
  const [zoom, setZoom]             = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modalLocId, setModalLocId] = useState<string|null>(null)
  const isMobile = useIsMobile()
  const dragging      = useRef(false)
  const lastMouse     = useRef<{x:number,y:number}|null>(null)
  const dragDist      = useRef(0)
  const lastPinchDist = useRef<number|null>(null)
  const starsRef      = useRef<any[]|null>(null)

  const isHidden = (loc:any) => (loc.type==='hidden'||loc.type==='command') && !showHidden
  const toScreen = (x:number,y:number) => ({x:x*zoom+pan.x, y:y*zoom+pan.y})
  const toWorld  = (x:number,y:number) => ({x:(x-pan.x)/zoom, y:(y-pan.y)/zoom})

  function draw() {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#050a14'; ctx.fillRect(0,0,W,H)

    // Stars
    if (!starsRef.current) {
      starsRef.current = Array.from({length:400},()=>({
        x:Math.random()*1800,y:Math.random()*1200,
        r:Math.random()*1.2+0.2,a:Math.random()*0.55+0.15
      }))
    }
    starsRef.current.forEach(s => {
      const sx=s.x*zoom+pan.x,sy=s.y*zoom+pan.y
      if(sx<-2||sx>W+2||sy<-2||sy>H+2) return
      ctx.beginPath(); ctx.arc(sx,sy,s.r,0,Math.PI*2)
      ctx.fillStyle=`rgba(200,210,255,${s.a})`; ctx.fill()
    })

    // Lanes
    LANES.forEach((l:any) => {
      const a=LOCATIONS.find(n=>n.id===l.a), b=LOCATIONS.find(n=>n.id===l.b)
      if(!a||!b) return
      if(!showHidden && (isHidden(a)||isHidden(b))) return
      const sa=toScreen(a.x,a.y), sb=toScreen(b.x,b.y)
      ctx.save(); ctx.beginPath(); ctx.moveTo(sa.x,sa.y); ctx.lineTo(sb.x,sb.y)
      if (l.h||l.c) { ctx.setLineDash([5,9]); ctx.strokeStyle='rgba(35,58,105,0.6)'; ctx.lineWidth=1 }
      else          { ctx.setLineDash([]);     ctx.strokeStyle='rgba(55,92,168,0.5)'; ctx.lineWidth=1.5 }
      if (selected&&(l.a===selected||l.b===selected)) {
        ctx.strokeStyle='rgba(212,172,13,0.5)'; ctx.lineWidth=2.5; ctx.setLineDash([])
      }
      ctx.stroke(); ctx.restore()
      if (zoom>0.9 && !isHidden(a) && !isHidden(b)) {
        const dx=a.x-b.x,dy=a.y-b.y
        const dist=Math.round(Math.sqrt(dx*dx+dy*dy)*0.32)
        if (dist>0) {
          const mx=(sa.x+sb.x)/2, my=(sa.y+sb.y)/2
          ctx.save(); ctx.font=`${Math.round(11*Math.min(zoom,1.4))}px Share Tech Mono`
          ctx.fillStyle='rgba(72,100,158,0.8)'; ctx.textAlign='center'
          ctx.fillText(`${dist} ly`,mx,my-4); ctx.restore()
        }
      }
    })

    // Hazard zones
    LOCATIONS.filter(n=>n.type==='hazard').forEach(n => {
      const s=toScreen(n.x,n.y), r=50*zoom
      ctx.save(); ctx.beginPath(); ctx.arc(s.x,s.y,r,0,Math.PI*2)
      ctx.fillStyle='rgba(55,88,170,0.07)'; ctx.strokeStyle='rgba(55,88,170,0.28)'
      ctx.lineWidth=1.5; ctx.setLineDash([4,6]); ctx.fill(); ctx.stroke(); ctx.restore()
    })

    // Location nodes
    LOCATIONS.filter(n=>n.type!=='hazard').forEach(n => {
      const T = TYPE_META[n.type]; if (!T) return
      const hidden = isHidden(n)
      const s = toScreen(n.x,n.y)
      const r = (n.type==='home'?14:n.type==='command'?12:11)*zoom
      if (hidden) {
        ctx.save(); ctx.beginPath(); ctx.arc(s.x,s.y,r*0.7,0,Math.PI*2)
        ctx.strokeStyle='rgba(171,71,188,0.35)'; ctx.lineWidth=1; ctx.setLineDash([3,4]); ctx.stroke()
        if (zoom>0.75) {
          ctx.font=`${Math.round(13*zoom)}px Share Tech Mono`
          ctx.fillStyle='rgba(171,71,188,0.45)'; ctx.textAlign='center'
          ctx.fillText('?',s.x,s.y+4)
        }
        ctx.restore(); return
      }
      if (selected===n.id||hover===n.id) {
        ctx.save(); ctx.beginPath(); ctx.arc(s.x,s.y,r+5*zoom,0,Math.PI*2)
        ctx.strokeStyle=selected===n.id?'#D4AC0D':'rgba(255,255,255,0.22)'
        ctx.lineWidth=selected===n.id?2:1; ctx.stroke(); ctx.restore()
      }
      ctx.save(); ctx.beginPath(); ctx.arc(s.x,s.y,r,0,Math.PI*2)
      ctx.fillStyle=T.color; ctx.fill()
      ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.lineWidth=1.5; ctx.stroke(); ctx.restore()
      if (zoom>0.55) {
        const fz=Math.max(13,Math.round(14*Math.min(zoom,1.6)))
        ctx.save(); ctx.font=`600 ${fz}px Exo 2`; ctx.textAlign='center'
        ctx.fillStyle=n.type==='home'?'#4fc3f7':n.type==='command'?'#00e5ff':'rgba(188,202,228,0.9)'
        ctx.fillText(n.name,s.x,s.y+r+13)
        if (zoom>0.85&&n.ly) {
          ctx.font=`${Math.max(12,Math.round(12*zoom))}px Share Tech Mono`
          ctx.fillStyle='rgba(110,130,172,0.7)'
          ctx.fillText(`${n.ly} ly`,s.x,s.y+r+24)
        }
        ctx.restore()
      }
    })

    // Hazard labels
    LOCATIONS.filter(n=>n.type==='hazard').forEach(n => {
      if (zoom>0.55) {
        const s=toScreen(n.x,n.y),r=50*zoom
        ctx.save(); ctx.font=`${Math.max(13,Math.round(13*zoom))}px Exo 2`
        ctx.fillStyle='rgba(240,98,146,0.65)'; ctx.textAlign='center'
        ctx.fillText(n.name,s.x,s.y+r+13); ctx.restore()
      }
    })
  }

  useEffect(() => { draw() }, [pan,zoom,selected,hover,showHidden])

  useEffect(() => {
    function resize() {
      const c=canvasRef.current; if(!c) return
      const w=c.parentElement!; c.width=w.clientWidth; c.height=w.clientHeight; draw()
    }
    resize()
    window.addEventListener('resize',resize)
    return () => window.removeEventListener('resize',resize)
  }, [])

  function nodeAt(wx:number,wy:number) {
    let best:any=null, bestD=Infinity
    LOCATIONS.forEach(n => {
      if (isHidden(n)) return
      const r = n.type==='hazard'?50:n.type==='home'?14:11
      const dx=wx-n.x,dy=wy-n.y,d=Math.sqrt(dx*dx+dy*dy)
      if (d<r+8&&d<bestD){bestD=d;best=n}
    })
    return best
  }

  const selLoc = LOCATIONS.find(l=>l.id===selected)

  const showSidebar = isMobile ? sidebarOpen : true

  return (
    <div style={{height:'100%',display:'flex',position:'relative'}}>
      {/* Canvas */}
      <div style={{flex:1,position:'relative',overflow:'hidden',
                   background:'radial-gradient(ellipse at 30% 50%, rgba(10,20,40,0.8) 0%, #04060C 70%)'}}>
        <canvas ref={canvasRef}
          style={{cursor:dragging.current?'grabbing':'grab',display:'block',width:'100%',height:'100%',touchAction:'none'}}
          onMouseDown={e=>{dragging.current=false;dragDist.current=0;lastMouse.current={x:e.clientX,y:e.clientY}}}
          onMouseMove={e=>{
            if(lastMouse.current){
              const dx=e.clientX-lastMouse.current.x,dy=e.clientY-lastMouse.current.y
              dragDist.current+=Math.abs(dx)+Math.abs(dy)
              if(dragDist.current>4)dragging.current=true
              if(dragging.current){setPan(p=>({x:p.x+dx,y:p.y+dy}));lastMouse.current={x:e.clientX,y:e.clientY}}
            }
            const rect=canvasRef.current!.getBoundingClientRect()
            const w=toWorld(e.clientX-rect.left,e.clientY-rect.top)
            setHover(nodeAt(w.x,w.y)?.id||null)
          }}
          onMouseUp={e=>{
            if(!dragging.current){
              const rect=canvasRef.current!.getBoundingClientRect()
              const w=toWorld(e.clientX-rect.left,e.clientY-rect.top)
              const n=nodeAt(w.x,w.y)
              setSelected(n?(n.id===selected?null:n.id):null)
            }
            dragging.current=false;lastMouse.current=null
          }}
          onMouseLeave={()=>{setHover(null);dragging.current=false;lastMouse.current=null}}
          onWheel={e=>{
            e.preventDefault()
            const rect=canvasRef.current!.getBoundingClientRect()
            const mx=e.clientX-rect.left,my=e.clientY-rect.top
            const f=e.deltaY<0?1.12:0.89
            setPan(p=>({x:mx-(mx-p.x)*f,y:my-(my-p.y)*f}))
            setZoom(z=>Math.min(3,Math.max(0.35,z*f)))
          }}
          onTouchStart={e=>{
            e.preventDefault()
            if(e.touches.length===1){
              dragging.current=false;dragDist.current=0
              lastMouse.current={x:e.touches[0].clientX,y:e.touches[0].clientY}
            } else if(e.touches.length===2){
              lastPinchDist.current=Math.hypot(
                e.touches[1].clientX-e.touches[0].clientX,
                e.touches[1].clientY-e.touches[0].clientY
              )
            }
          }}
          onTouchMove={e=>{
            e.preventDefault()
            if(e.touches.length===1&&lastMouse.current){
              const dx=e.touches[0].clientX-lastMouse.current.x
              const dy=e.touches[0].clientY-lastMouse.current.y
              dragDist.current+=Math.abs(dx)+Math.abs(dy)
              if(dragDist.current>4)dragging.current=true
              if(dragging.current){
                setPan(p=>({x:p.x+dx,y:p.y+dy}))
                lastMouse.current={x:e.touches[0].clientX,y:e.touches[0].clientY}
              }
            } else if(e.touches.length===2&&lastPinchDist.current!==null){
              const dist=Math.hypot(
                e.touches[1].clientX-e.touches[0].clientX,
                e.touches[1].clientY-e.touches[0].clientY
              )
              const f=dist/lastPinchDist.current
              const rect=canvasRef.current!.getBoundingClientRect()
              const cx=(e.touches[0].clientX+e.touches[1].clientX)/2-rect.left
              const cy=(e.touches[0].clientY+e.touches[1].clientY)/2-rect.top
              setPan(p=>({x:cx-(cx-p.x)*f,y:cy-(cy-p.y)*f}))
              setZoom(z=>Math.min(3,Math.max(0.35,z*f)))
              lastPinchDist.current=dist
            }
          }}
          onTouchEnd={e=>{
            if(!dragging.current&&e.changedTouches.length===1&&e.touches.length===0){
              const rect=canvasRef.current!.getBoundingClientRect()
              const t=e.changedTouches[0]
              const w=toWorld(t.clientX-rect.left,t.clientY-rect.top)
              const n=nodeAt(w.x,w.y)
              setSelected(n?(n.id===selected?null:n.id):null)
              if(isMobile&&n) setSidebarOpen(true)
            }
            if(e.touches.length===0){dragging.current=false;lastMouse.current=null;lastPinchDist.current=null}
          }}
        />
        {/* Mobile toggle button */}
        {isMobile && (
          <button onClick={()=>setSidebarOpen(o=>!o)}
            style={{position:'absolute',bottom:16,right:16,width:44,height:44,borderRadius:'50%',
                    background:'var(--panel)',border:'1px solid var(--border2)',
                    color:'var(--gold)',fontSize:21,display:'flex',alignItems:'center',
                    justifyContent:'center',zIndex:10,boxShadow:'0 2px 12px rgba(0,0,0,0.6)'}}>
            ☰
          </button>
        )}
      </div>

      {/* Sidebar — full-screen overlay on mobile, fixed panel on desktop */}
      {showSidebar && (
        <div style={isMobile ? {
          position:'absolute',inset:0,zIndex:20,background:'var(--bg2)',
          display:'flex',flexDirection:'column',overflow:'hidden'
        } : {
          width:300,flexShrink:0,background:'var(--bg2)',
          borderLeft:'1px solid var(--border)',display:'flex',flexDirection:'column',overflow:'hidden'
        }}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',
                       display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontFamily:'var(--display)',fontSize:16,fontWeight:700,
                         letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gold)'}}>
              Navigation Data
            </div>
            {isMobile && (
              <button onClick={()=>setSidebarOpen(false)}
                style={{background:'none',border:'none',color:'var(--text-dim)',fontSize:23,cursor:'pointer',lineHeight:1}}>
                ×
              </button>
            )}
          </div>
          <div style={{flex:1,overflowY:'auto',padding:12}}>
            {!isMobile && (
              <p style={{fontSize:16,color:'var(--text-dim)',fontFamily:'var(--mono)',marginBottom:12,lineHeight:1.6}}>
                Click a node to select. Scroll to zoom. Drag to pan.
              </p>
            )}
            {selLoc && (
              <div style={{background:'rgba(212,172,13,0.06)',border:'1px solid rgba(212,172,13,0.4)',
                           borderRadius:6,padding:12,marginBottom:12}}>
                <div style={{fontFamily:'var(--display)',fontSize:17,fontWeight:600,color:'var(--text-bright)',marginBottom:4}}>
                  {selLoc.name}
                </div>
                <div style={{fontSize:15,fontFamily:'var(--mono)',letterSpacing:'0.1em',textTransform:'uppercase',
                             color:TYPE_META[selLoc.type]?.color,marginBottom:6}}>
                  {TYPE_META[selLoc.type]?.label}
                </div>
                <div style={{fontSize:16,color:'var(--text-dim)',lineHeight:1.5,marginBottom:8}}>{selLoc.desc}</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {selLoc.ly && (
                    <span style={{fontFamily:'var(--mono)',fontSize:15,background:'rgba(255,255,255,0.06)',
                                  borderRadius:3,padding:'2px 6px',color:'var(--text-dim)'}}>
                      {selLoc.ly} ly
                    </span>
                  )}
                  <span style={{fontFamily:'var(--mono)',fontSize:15,background:'rgba(255,100,100,0.08)',
                                borderRadius:3,padding:'2px 6px',color:'rgba(255,120,120,0.8)'}}>
                    {selLoc.threat}
                  </span>
                </div>
                {(LOCATION_DATA[selLoc.id] || true) && (
                  <button onClick={()=>setModalLocId(selLoc.id)}
                    style={{marginTop:8,width:'100%',background:'rgba(212,172,13,0.1)',
                            border:'1px solid rgba(212,172,13,0.5)',borderRadius:4,padding:'7px',
                            color:'var(--gold)',fontFamily:'var(--display)',fontSize:16,
                            fontWeight:700,letterSpacing:'0.08em',cursor:'pointer',transition:'background 0.15s'}}>
                    View Details
                  </button>
                )}
              </div>
            )}
            <div style={{fontSize:16,color:'var(--text-dim)',fontFamily:'var(--display)',fontWeight:700,
                         letterSpacing:'0.1em',textTransform:'uppercase',marginTop:8,marginBottom:8}}>
              All Locations
            </div>
            {LOCATIONS.filter(l=>l.type!=='hazard'&&(!isHidden(l))).map(loc=>(
              <div key={loc.id}
                onClick={()=>{setSelected(loc.id===selected?null:loc.id);if(isMobile)setSidebarOpen(false)}}
                style={{background:selected===loc.id?'rgba(212,172,13,0.06)':'var(--panel)',
                        border:`1px solid ${selected===loc.id?'rgba(212,172,13,0.4)':'var(--border)'}`,
                        borderRadius:6,padding:'8px 10px',marginBottom:5,cursor:'pointer',transition:'all 0.2s'}}>
                <div style={{fontFamily:'var(--display)',fontSize:15,fontWeight:600,color:'var(--text-bright)',marginBottom:2}}>
                  {loc.name}
                </div>
                <div style={{fontSize:14,fontFamily:'var(--mono)',letterSpacing:'0.1em',textTransform:'uppercase',
                             color:TYPE_META[loc.type]?.color}}>
                  {TYPE_META[loc.type]?.label}
                  {loc.ly ? `  ·  ${loc.ly} ly` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {modalLocId && <LocationModal locId={modalLocId} isGm={isGm} onClose={()=>setModalLocId(null)} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTER SHEET
// ─────────────────────────────────────────────────────────────────────────────
function CharacterSheet({ char, onChange }: { char:any; onChange:(c:any)=>void }) {
  const color = CHAR_COLORS[char.colorIdx] || CHAR_COLORS[0]
  const initials = (char.name||'??').split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()||'??'

  function update(path: string, val: any) {
    const parts = path.split('.'); const nc={...char}; let obj=nc
    for(let i=0;i<parts.length-1;i++){obj[parts[i]]={...obj[parts[i]]};obj=obj[parts[i]]}
    obj[parts[parts.length-1]]=val; onChange(nc)
  }

  const [newTalent, setNewTalent] = useState({name:'',desc:''})
  const [newWeapon, setNewWeapon] = useState({name:'',skill:'',dam:'',crit:'',range:'',qualities:''})

  const derivedWT   = (char.characteristics?.Brawn||2) + (char.woundThreshold||12)
  const derivedST   = (char.characteristics?.Willpower||2) + (char.strainThreshold||12)
  const derivedSoak = (char.characteristics?.Brawn||2) + (char.soak||0)

  const inp = (style?:any) => ({
    background:'none',border:'none',borderBottom:'1px solid var(--border)',
    color:'var(--text)',fontFamily:'var(--body)',fontSize:15,padding:'2px 0',
    outline:'none',minWidth:80,...style
  })

  return (
    <div style={{flex:1,overflowY:'auto',padding:20,background:'var(--bg)'}}>
      <div style={{maxWidth:900,margin:'0 auto'}}>

        {/* ── Header ── */}
        <div style={{display:'flex',alignItems:'flex-start',gap:20,marginBottom:24,
                     padding:20,background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8}}>
          <div style={{width:72,height:72,borderRadius:'50%',display:'flex',alignItems:'center',
                       justifyContent:'center',background:`${color}22`,border:`2px solid ${color}`,flexShrink:0}}>
            <span style={{fontFamily:'var(--display)',fontSize:35,fontWeight:700,color}}>{initials}</span>
          </div>
          <div style={{flex:1}}>
            <input value={char.name||''} onChange={e=>update('name',e.target.value)} placeholder="Character Name"
              style={{fontFamily:'var(--display)',fontSize:27,fontWeight:700,color:'var(--text-bright)',
                      background:'none',border:'none',borderBottom:'1px solid var(--border2)',
                      width:'100%',marginBottom:8,padding:'2px 0',outline:'none'}}/>
            <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
              {[['player','Player'],['species','Species'],['career','Career'],['specialisation','Specialisation']].map(([k,l])=>(
                <div key={k} style={{display:'flex',flexDirection:'column',gap:2}}>
                  <div style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',
                               textTransform:'uppercase',letterSpacing:'0.1em'}}>{l}</div>
                  <input value={char[k]||''} onChange={e=>update(k,e.target.value)} placeholder="—"
                    style={inp({minWidth:90})}/>
                </div>
              ))}
              <div style={{display:'flex',flexDirection:'column',gap:2}}>
                <div style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',
                             textTransform:'uppercase',letterSpacing:'0.1em'}}>Colour</div>
                <div style={{display:'flex',gap:5,marginTop:4}}>
                  {CHAR_COLORS.map((c,i)=>(
                    <div key={i} onClick={()=>update('colorIdx',i)}
                      style={{width:16,height:16,borderRadius:'50%',background:c,cursor:'pointer',
                              border:char.colorIdx===i?'2px solid white':'2px solid transparent'}}/>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end',flexShrink:0}}>
            <div>
              <div style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',textAlign:'right',marginBottom:2}}>XP SPENT</div>
              <div style={{display:'flex',alignItems:'center',gap:4}}>
                <div style={{fontFamily:'var(--display)',fontSize:23,fontWeight:700,color:'var(--gold)'}}>{char.xp||0}</div>
                <SBtn onClick={()=>update('xp',(char.xp||0)+5)}>+</SBtn>
                <SBtn onClick={()=>update('xp',Math.max(0,(char.xp||0)-5))}>−</SBtn>
              </div>
            </div>
            <div>
              <div style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',textAlign:'right',marginBottom:2}}>DUTY</div>
              <div style={{display:'flex',alignItems:'center',gap:4}}>
                <div style={{fontFamily:'var(--display)',fontSize:23,fontWeight:700,color:'var(--gold)'}}>{char.duty||0}</div>
                <SBtn onClick={()=>update('duty',(char.duty||0)+1)}>+</SBtn>
                <SBtn onClick={()=>update('duty',Math.max(0,(char.duty||0)-1))}>−</SBtn>
              </div>
            </div>
          </div>
        </div>

        {/* ── Characteristics ── */}
        <CardSection title="Characteristics">
          <div className="sr-char-grid-6">
            {CHAR_KEYS.map(k=>(
              <div key={k} style={{background:'var(--panel)',border:'1px solid var(--border)',
                                   borderRadius:6,padding:'10px 8px',textAlign:'center'}}>
                <div style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',
                             textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>{k}</div>
                <div style={{fontFamily:'var(--display)',fontSize:31,fontWeight:700,
                             color:'var(--text-bright)',lineHeight:1}}>
                  {char.characteristics?.[k]||1}
                </div>
                <div style={{display:'flex',gap:4,justifyContent:'center',marginTop:6}}>
                  <SBtn onClick={()=>update(`characteristics.${k}`,Math.max(1,(char.characteristics?.[k]||1)-1))}>−</SBtn>
                  <SBtn onClick={()=>update(`characteristics.${k}`,Math.min(6,(char.characteristics?.[k]||1)+1))}>+</SBtn>
                </div>
              </div>
            ))}
          </div>
        </CardSection>

        {/* ── Derived Stats ── */}
        <CardSection title="Derived Statistics">
          <div className="sr-char-grid-4">
            {([['Wounds','wounds',derivedWT,'var(--red)'],
               ['Strain','strain',derivedST,'#E67E22']] as [string,string,number,string][]).map(([lbl,field,max,col])=>(
              <div key={field} style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:10}}>
                <div style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',
                             textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{lbl}</div>
                <div style={{fontFamily:'var(--display)',fontSize:23,fontWeight:700,color:'var(--text-bright)'}}>
                  {char[field]||0} / {max}
                </div>
                <div style={{display:'flex',gap:3,flexWrap:'wrap',marginTop:6}}>
                  {Array.from({length:max}).map((_,i)=>(
                    <div key={i}
                      onClick={()=>update(field,i<(char[field]||0)?i:i+1)}
                      style={{width:13,height:13,borderRadius:2,cursor:'pointer',
                              border:'1px solid rgba(255,255,255,0.14)',
                              background:i<(char[field]||0)?col:'transparent'}}/>
                  ))}
                </div>
              </div>
            ))}
            <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:10}}>
              <div style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',
                           textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Soak</div>
              <div style={{fontFamily:'var(--display)',fontSize:23,fontWeight:700,color:'var(--text-bright)'}}>{derivedSoak}</div>
              <div style={{fontSize:15,color:'var(--text-dim)',marginTop:4}}>Brawn + armour</div>
            </div>
            <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:10}}>
              <div style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',
                           textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Defence</div>
              <div style={{fontFamily:'var(--display)',fontSize:23,fontWeight:700,color:'var(--text-bright)'}}>{char.defense||0}</div>
              <div style={{display:'flex',gap:4,marginTop:6}}>
                <SBtn onClick={()=>update('defense',Math.max(0,(char.defense||0)-1))}>−</SBtn>
                <SBtn onClick={()=>update('defense',(char.defense||0)+1)}>+</SBtn>
              </div>
            </div>
          </div>
        </CardSection>

        {/* ── Skills ── */}
        <CardSection title="Skills">
          <div className="sr-skills-grid">
            {Object.entries({...DEFAULT_SKILLS,...(char.skills||{})}).map(([skill,rawVal]:any)=>{
              const rank         = typeof rawVal==='object' ? (rawVal.rank??0) : (rawVal??0)
              const charOverride = typeof rawVal==='object' ? rawVal.char : undefined
              const defaultAbbr  = SKILL_CHAR[skill] || 'Br'
              const abbr         = charOverride || defaultAbbr
              const isCustom     = !!charOverride && charOverride !== defaultAbbr
              const charKey      = Object.keys(CHAR_ABBR).find(k=>CHAR_ABBR[k]===abbr)
              const charVal      = charKey ? (char.characteristics?.[charKey]||2) : 2
              const prof         = Math.min(rank,charVal)
              const abil         = Math.max(rank,charVal) - prof
              return (
                <div key={skill} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 6px',borderRadius:4}}>
                  <div
                    onClick={()=>{
                      const next = CHAR_ABBR_CYCLE[(CHAR_ABBR_CYCLE.indexOf(abbr)+1) % CHAR_ABBR_CYCLE.length]
                      update(`skills.${skill}`, next===defaultAbbr ? rank : {rank, char:next})
                    }}
                    title={`Linked to ${abbr} — click to change`}
                    style={{fontSize:15,fontFamily:'var(--mono)',width:30,textAlign:'center',
                            cursor:'pointer',borderRadius:3,padding:'1px 2px',userSelect:'none',
                            color:isCustom?'var(--gold)':'var(--text-dim)',
                            background:isCustom?'rgba(212,172,13,0.1)':'transparent',
                            border:isCustom?'1px solid rgba(212,172,13,0.35)':'1px solid transparent'}}>
                    {abbr}
                  </div>
                  <div style={{flex:1,fontSize:15,color:'var(--text)'}}>{skill}</div>
                  <div style={{display:'flex',gap:3}}>
                    {Array.from({length:prof}).map((_,i)=>(
                      <div key={`p${i}`} style={{width:14,height:14,borderRadius:3,background:'#FFD700',
                                                  color:'#332200',display:'flex',alignItems:'center',
                                                  justifyContent:'center',fontSize:14,fontWeight:700}}>Y</div>
                    ))}
                    {Array.from({length:abil}).map((_,i)=>(
                      <div key={`a${i}`} style={{width:14,height:14,borderRadius:3,background:'#4CAF50',
                                                  color:'#002200',display:'flex',alignItems:'center',
                                                  justifyContent:'center',fontSize:14,fontWeight:700}}>G</div>
                    ))}
                    {rank===0&&<div style={{width:14,height:14,borderRadius:3,background:'rgba(255,255,255,0.08)',
                                            color:'var(--text-dim)',display:'flex',alignItems:'center',
                                            justifyContent:'center',fontSize:14}}>—</div>}
                  </div>
                  <div style={{display:'flex',gap:2,alignItems:'center'}}>
                    <SBtn onClick={()=>update(`skills.${skill}`, typeof rawVal==='object'?{...rawVal,rank:Math.max(0,rank-1)}:Math.max(0,rank-1))}>−</SBtn>
                    <span style={{fontFamily:'var(--mono)',fontSize:16,width:14,textAlign:'center',color:'var(--text)'}}>{rank}</span>
                    <SBtn onClick={()=>update(`skills.${skill}`, typeof rawVal==='object'?{...rawVal,rank:Math.min(5,rank+1)}:Math.min(5,rank+1))}>+</SBtn>
                  </div>
                </div>
              )
            })}
          </div>
        </CardSection>

        {/* ── Talents ── */}
        <CardSection title="Talents & Abilities">
          {(char.talents||[]).map((t:any,i:number)=>(
            <div key={i} style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,
                                  padding:10,display:'flex',gap:10,alignItems:'flex-start',marginBottom:6}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:'var(--display)',fontSize:15,fontWeight:600,color:'var(--text-bright)',marginBottom:2}}>{t.name}</div>
                <div style={{fontSize:16,color:'var(--text-dim)',lineHeight:1.5}}>{t.desc}</div>
              </div>
              <button onClick={()=>update('talents',(char.talents||[]).filter((_:any,j:number)=>j!==i))}
                style={{background:'none',border:'none',color:'var(--text-dim)',fontSize:19,cursor:'pointer'}}>×</button>
            </div>
          ))}
          <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:8}}>
            <input value={newTalent.name} onChange={e=>setNewTalent(t=>({...t,name:e.target.value}))}
              placeholder="Talent name"
              style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,
                      padding:'8px 10px',color:'var(--text)',fontFamily:'var(--body)',fontSize:15,outline:'none'}}/>
            <div style={{display:'flex',gap:8}}>
              <input value={newTalent.desc} onChange={e=>setNewTalent(t=>({...t,desc:e.target.value}))}
                placeholder="Description"
                style={{flex:1,background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,
                        padding:'8px 10px',color:'var(--text)',fontFamily:'var(--body)',fontSize:15,outline:'none'}}/>
              <Btn variant="primary" onClick={()=>{
                if(!newTalent.name.trim()) return
                update('talents',[...(char.talents||[]),newTalent])
                setNewTalent({name:'',desc:''})
              }}>Add</Btn>
            </div>
          </div>
        </CardSection>

        {/* ── Weapons ── */}
        <CardSection title="Weapons">
          <div style={{overflowX:'auto',WebkitOverflowScrolling:'touch' as any}}>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:480}}>
            <thead>
              <tr>{['Name','Skill','Dam','Crit','Range','Qualities',''].map(h=>(
                <th key={h} style={{fontFamily:'var(--mono)',fontSize:14,textTransform:'uppercase',
                                    letterSpacing:'0.08em',color:'var(--text-dim)',padding:'5px 7px',
                                    textAlign:'left',borderBottom:'1px solid var(--border)'}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {(char.weapons||[]).map((w:any,i:number)=>(
                <tr key={i}>
                  {(['name','skill','dam','crit','range','qualities'] as const).map(f=>(
                    <td key={f} style={{padding:'6px 7px',fontSize:15,borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                      <input value={w[f]||''} onChange={e=>{
                        const ws=[...char.weapons]; ws[i]={...ws[i],[f]:e.target.value}; update('weapons',ws)
                      }} style={{background:'none',border:'none',color:'var(--text)',fontFamily:'var(--body)',fontSize:15,outline:'none',width:'100%'}}/>
                    </td>
                  ))}
                  <td>
                    <button onClick={()=>update('weapons',(char.weapons||[]).filter((_:any,j:number)=>j!==i))}
                      style={{background:'none',border:'none',color:'var(--text-dim)',fontSize:19,cursor:'pointer'}}>×</button>
                  </td>
                </tr>
              ))}
              <tr>
                {(['name','skill','dam','crit','range','qualities'] as const).map(f=>(
                  <td key={f} style={{padding:'4px 7px'}}>
                    <input value={(newWeapon as any)[f]||''} onChange={e=>setNewWeapon(w=>({...w,[f]:e.target.value}))}
                      placeholder={f}
                      style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:4,
                              padding:'5px 7px',color:'var(--text)',fontFamily:'var(--body)',fontSize:15,
                              outline:'none',width:'100%'}}/>
                  </td>
                ))}
                <td style={{padding:'4px 7px'}}>
                  <Btn variant="primary" style={{padding:'6px 10px'}} onClick={()=>{
                    if(!newWeapon.name.trim()) return
                    update('weapons',[...(char.weapons||[]),newWeapon])
                    setNewWeapon({name:'',skill:'',dam:'',crit:'',range:'',qualities:''})
                  }}>+</Btn>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </CardSection>

        {/* ── Notes ── */}
        <CardSection title="Notes & Backstory">
          <textarea value={char.notes||''} onChange={e=>update('notes',e.target.value)} rows={5}
            style={{width:'100%',background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,
                    padding:10,color:'var(--text)',fontFamily:'var(--body)',fontSize:15,
                    resize:'vertical',outline:'none',lineHeight:1.6}}
            placeholder="Character notes, backstory, contacts..."/>
        </CardSection>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTERS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function CharactersView({ isGm, userId }: { isGm: boolean; userId: string }) {
  const [chars, setChars]       = useState<any[]>([])
  const [activeId, setActiveId] = useState<string|null>(null)
  const [saving, setSaving]     = useState(false)
  const [loading, setLoading]   = useState(true)
  const isMobile                = useIsMobile()

  // On mobile: show list pane or sheet pane, not both
  const showSheet = !isMobile || activeId !== null
  const showList  = !isMobile || activeId === null

  const activeChar    = chars.find(c=>c.id===activeId)
  const debouncedChar = useDebounce(activeChar, 1000)

  useEffect(() => {
    api('/api/characters').then(d=>{
      setChars(d)
      if (!isGm && d.length > 0) setActiveId(d[0].id)
      setLoading(false)
    }).catch(()=>setLoading(false))
  }, [])

  useEffect(() => {
    if (!debouncedChar?.id) return
    setSaving(true)
    api(`/api/characters/${debouncedChar.id}`, 'PUT', debouncedChar)
      .finally(() => setSaving(false))
  }, [debouncedChar])

  async function addChar() {
    const id = crypto.randomUUID()
    const nc = {...DEFAULT_CHAR, id, colorIdx:chars.length % CHAR_COLORS.length}
    await api('/api/characters','POST',nc)
    setChars(c=>[...c,nc]); setActiveId(id)
  }

  async function deleteChar(id: string) {
    await api(`/api/characters/${id}`,'DELETE')
    setChars(c=>c.filter(ch=>ch.id!==id))
    if (activeId===id) setActiveId(chars.find(c=>c.id!==id)?.id||null)
  }

  function updateChar(id: string, nc: any) {
    setChars(c=>c.map(ch=>ch.id===id?{...nc,id}:ch))
  }

  return (
    <div style={{height:'100%',display:'flex'}}>
      {/* List sidebar */}
      {showList && <div style={isMobile
        ? {flex:1,background:'var(--bg2)',display:'flex',flexDirection:'column'}
        : {width:260,flexShrink:0,background:'var(--bg2)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',
                     display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontFamily:'var(--display)',fontSize:16,fontWeight:700,
                       letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gold)'}}>Characters</div>
          <button onClick={addChar}
            style={{width:28,height:28,borderRadius:'50%',border:'1px solid var(--border2)',
                    background:'var(--panel)',color:'var(--text-dim)',fontSize:21,cursor:'pointer',
                    display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:8}}>
          {loading && <div style={{padding:'20px',textAlign:'center',color:'var(--text-dim)',fontSize:16,fontFamily:'var(--mono)'}}>Loading...</div>}
          {!loading&&chars.length===0 && (
            <div style={{padding:'20px',textAlign:'center',color:'var(--text-dim)',fontSize:16,fontFamily:'var(--mono)'}}>
              {`No characters yet.`}<br/>{`Click + to create one.`}
            </div>
          )}
          {chars.map(c=>{
            const col=CHAR_COLORS[c.colorIdx]||CHAR_COLORS[0]
            const ini=(c.name||'??').split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()||'??'
            const canDelete = isGm || c.ownerId === userId
            return (
              <div key={c.id} onClick={()=>setActiveId(c.id)}
                style={{padding:'9px 10px',borderRadius:6,cursor:'pointer',marginBottom:2,
                        display:'flex',alignItems:'center',gap:10,transition:'all 0.2s',
                        background:activeId===c.id?'rgba(212,172,13,0.08)':'transparent',
                        border:activeId===c.id?'1px solid rgba(212,172,13,0.3)':'1px solid transparent'}}>
                <div style={{width:36,height:36,borderRadius:'50%',display:'flex',alignItems:'center',
                             justifyContent:'center',background:`${col}22`,color:col,
                             fontFamily:'var(--display)',fontSize:19,fontWeight:700,flexShrink:0}}>
                  {ini}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:'var(--display)',fontSize:16,fontWeight:600,color:'var(--text-bright)'}}>{c.name}</div>
                  <div style={{fontSize:15,color:'var(--text-dim)'}}>{c.career}{c.specialisation?` · ${c.specialisation}`:''}</div>
                </div>
                {canDelete && (
                  <button onClick={e=>{e.stopPropagation();deleteChar(c.id)}}
                    style={{background:'none',border:'none',color:'var(--text-dim)',fontSize:17,cursor:'pointer'}}>×</button>
                )}
              </div>
            )
          })}
        </div>
        {saving && (
          <div style={{padding:'8px 12px',borderTop:'1px solid var(--border)',
                       fontSize:15,color:'var(--gold)',fontFamily:'var(--mono)',textAlign:'center'}}>
            Saving to database…
          </div>
        )}
      </div>}
      {/* Sheet area */}
      {showSheet && (
        activeChar
          ? <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>
              {isMobile && (
                <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',
                             background:'var(--bg2)',display:'flex',alignItems:'center',gap:10}}>
                  <button onClick={()=>setActiveId(null)}
                    style={{background:'none',border:'none',color:'var(--gold)',fontFamily:'var(--display)',
                            fontSize:16,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                    ← Back
                  </button>
                  <span style={{fontFamily:'var(--display)',fontSize:16,fontWeight:600,color:'var(--text-bright)'}}>
                    {activeChar.name}
                  </span>
                </div>
              )}
              <CharacterSheet key={activeChar.id} char={activeChar} onChange={c=>updateChar(activeChar.id,c)}/>
            </div>
          : (
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',
                         justifyContent:'center',gap:12,color:'var(--text-dim)',background:'var(--bg)'}}>
              <div style={{fontSize:51,opacity:0.3}}>◈</div>
              <div style={{fontFamily:'var(--display)',fontSize:19,letterSpacing:'0.08em'}}>
                Select or create a character
              </div>
              <Btn variant="primary" onClick={addChar}>{'Create Character'}</Btn>
            </div>
          )
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIATIVE TRACKER
// ─────────────────────────────────────────────────────────────────────────────
function InitiativeTracker() {
  const [data, setData]     = useState<any>({round:1,currentIdx:0,slots:[],log:[]})
  const [chars, setChars]   = useState<any[]>([])
  const [form, setForm]     = useState({name:'',type:'player',wt:12,st:12,charId:''})
  const [pool, setPool]     = useState({ability:0,proficiency:0,difficulty:0,challenge:0,boost:0,setback:0})
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = () => api('/api/initiative').then(d=>setData(d))

  useEffect(() => {
    Promise.all([api('/api/initiative'),api('/api/characters')])
      .then(([init,ch])=>{setData(init);setChars(ch);setLoading(false)})
      .catch(()=>setLoading(false))
  },[])

  async function act(body: any) { await api('/api/initiative','PUT',body); await loadData() }

  async function addCombatant() {
    if(!form.name.trim()) return
    const linked = chars.find(c=>c.id===form.charId)
    await act({action:'add_slot', slot:{
      id:  crypto.randomUUID(), name: form.name, type: form.type,
      wt:  linked ? linked.characteristics.Brawn + linked.woundThreshold   : Number(form.wt)||12,
      st:  linked ? linked.characteristics.Willpower + linked.strainThreshold : Number(form.st)||12,
      charId: form.charId,
    }})
    setForm({name:'',type:'player',wt:12,st:12,charId:''})
  }

  async function wound(slot:any, field:'wounds'|'strain', delta:number) {
    const max = field==='wounds' ? slot.wt : slot.st
    const val = Math.max(0,Math.min(max,(slot[field]||0)+delta))
    await act({action:'update_slot',id:slot.id,
               wounds: field==='wounds'?val:slot.wounds,
               strain: field==='strain'?val:slot.strain,
               crits: slot.crits, used: slot.used})
  }

  async function addCrit(slot:any) {
    await act({action:'update_slot',id:slot.id,wounds:slot.wounds,strain:slot.strain,
               crits:[...(slot.crits||[]),Math.floor(Math.random()*100)+1],used:slot.used})
  }

  function roll() {
    const r = rollDice(pool); setResult(r)
    const parts:string[]=[]
    if(r.s>0)  parts.push(`${r.s} Success`)
    if(r.f>0)  parts.push(`${r.f} Failure`)
    if(r.a>0)  parts.push(`${r.a} Advantage`)
    if(r.th>0) parts.push(`${r.th} Threat`)
    if(r.t>0)  parts.push(`TRIUMPH`)
    if(r.d>0)  parts.push(`DESPAIR`)
    act({action:'add_log', message:`Roll: ${parts.join(', ')||'No result'}`,
         type: r.t>0?'important':r.d>0?'danger':''})
  }

  const DIE_BTNS = [
    {key:'ability',     label:'Ability',     col:'#4CAF50'},
    {key:'proficiency', label:'Proficiency', col:'#FFD700'},
    {key:'difficulty',  label:'Difficulty',  col:'#9B59B6'},
    {key:'challenge',   label:'Challenge',   col:'var(--red)'},
    {key:'boost',       label:'Boost',       col:'var(--cyan)'},
    {key:'setback',     label:'Setback',     col:'#78909C'},
  ]

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--text-dim)',fontFamily:'var(--mono)'}}>Loading…</div>

  return (
    <div style={{height:'100%',display:'grid',gridTemplateColumns:'1fr 380px'}}>
      {/* Main combat area */}
      <div style={{padding:20,overflowY:'auto',display:'flex',flexDirection:'column',gap:14}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontFamily:'var(--display)',fontSize:25,fontWeight:700,color:'var(--text-bright)',letterSpacing:'0.06em'}}>
            Initiative Order
          </div>
          <div style={{display:'flex',gap:8}}>
            <Btn onClick={()=>act({action:'reset'})}>Reset</Btn>
            <Btn variant="success" onClick={()=>act({action:'advance'})}>Next Turn ▶</Btn>
          </div>
        </div>

        {/* Round banner */}
        <div style={{display:'flex',alignItems:'center',gap:16,padding:'12px 16px',
                     background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8}}>
          <div>
            <div style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Round</div>
            <div style={{fontFamily:'var(--display)',fontSize:39,fontWeight:700,color:'var(--gold)',lineHeight:1}}>{data.round}</div>
          </div>
          <div style={{width:1,background:'var(--border)',alignSelf:'stretch'}}/>
          <div>
            <div style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Active</div>
            <div style={{fontFamily:'var(--display)',fontSize:18,fontWeight:600,color:'var(--text-bright)'}}>
              {data.slots[data.currentIdx]?.name||'—'}
            </div>
          </div>
          <div style={{width:1,background:'var(--border)',alignSelf:'stretch'}}/>
          <div>
            <div style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Combatants</div>
            <div style={{fontFamily:'var(--display)',fontSize:25,fontWeight:700,color:'var(--text-bright)'}}>{data.slots.length}</div>
          </div>
        </div>

        {data.slots.length===0 && (
          <div style={{textAlign:'center',padding:'40px',color:'var(--text-dim)',fontFamily:'var(--mono)',fontSize:15}}>
            No combatants. Add them from the right panel.
          </div>
        )}

        {data.slots.map((slot:any, idx:number) => {
          const cur = idx===data.currentIdx
          const accent = slot.type==='player'?'var(--gold)':slot.type==='enemy'?'var(--red)':'var(--blue-bright)'
          return (
            <div key={slot.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',
                                       background:cur?`${accent}0D`:'var(--panel)',
                                       border:`1px solid ${cur?accent:'var(--border)'}`,borderRadius:6,
                                       transition:'all 0.2s',opacity:slot.used&&!cur?0.5:1,
                                       boxShadow:cur?`0 0 12px ${accent}1A`:'none',
                                       position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:accent}}/>
              <div style={{fontFamily:'var(--mono)',fontSize:19,fontWeight:700,
                           color:cur?accent:'var(--text-dim)',minWidth:26}}>{idx+1}</div>
              <span style={{padding:'2px 7px',borderRadius:3,fontSize:14,fontFamily:'var(--mono)',
                            textTransform:'uppercase',letterSpacing:'0.1em',
                            background:`${accent}33`,color:accent}}>{slot.type.toUpperCase()}</span>
              <div style={{fontFamily:'var(--display)',fontSize:17,fontWeight:600,color:'var(--text-bright)',flex:1}}>{slot.name}</div>
              {/* Wound pips */}
              <div style={{display:'flex',alignItems:'center',gap:3}}>
                <span style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)'}}>W</span>
                {Array.from({length:Math.min(slot.wt,15)}).map((_,i)=>(
                  <div key={i} onClick={()=>wound(slot,'wounds',i<(slot.wounds||0)?-1:1)}
                    style={{width:10,height:10,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.2)',cursor:'pointer',
                            background:i<(slot.wounds||0)?'var(--red)':'transparent'}}/>
                ))}
                <span style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',marginLeft:5}}>S</span>
                {Array.from({length:Math.min(slot.st,12)}).map((_,i)=>(
                  <div key={i} onClick={()=>wound(slot,'strain',i<(slot.strain||0)?-1:1)}
                    style={{width:10,height:10,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.2)',cursor:'pointer',
                            background:i<(slot.strain||0)?'#E67E22':'transparent'}}/>
                ))}
              </div>
              {(slot.crits||[]).length>0 && (
                <span style={{padding:'2px 6px',background:'rgba(192,57,43,0.3)',border:'1px solid var(--red)',
                              borderRadius:3,fontSize:14,fontFamily:'var(--mono)',color:'var(--red)'}}>
                  CRIT ×{slot.crits.length}
                </span>
              )}
              <div style={{display:'flex',gap:4}}>
                <button onClick={()=>addCrit(slot)} title="Add Critical"
                  style={{width:27,height:27,borderRadius:4,border:'1px solid var(--border)',
                          background:'rgba(255,255,255,0.04)',color:'var(--text-dim)',cursor:'pointer',
                          display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>⚡</button>
                <button onClick={()=>act({action:'remove_slot',id:slot.id})}
                  style={{width:27,height:27,borderRadius:4,border:'1px solid var(--border)',
                          background:'rgba(255,255,255,0.04)',color:'var(--red)',cursor:'pointer',
                          display:'flex',alignItems:'center',justifyContent:'center',fontSize:17}}>×</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Right sidebar — tools */}
      <div style={{background:'var(--bg2)',borderLeft:'1px solid var(--border)',
                   display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',
                     fontFamily:'var(--display)',fontSize:16,fontWeight:700,
                     letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gold)'}}>
          Combat Tools
        </div>
        <div style={{flex:1,overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:12}}>

          {/* Add combatant */}
          <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8,padding:14,display:'flex',flexDirection:'column',gap:10}}>
            <div style={{fontFamily:'var(--display)',fontSize:16,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-dim)'}}>
              Add Combatant
            </div>
            <div style={{display:'flex',gap:4}}>
              {['player','enemy','npc'].map(t=>{
                const col=t==='player'?'var(--gold)':t==='enemy'?'var(--red)':'var(--blue-bright)'
                return (
                  <button key={t} onClick={()=>setForm(f=>({...f,type:t}))}
                    style={{flex:1,padding:7,borderRadius:5,cursor:'pointer',
                            border:`1px solid ${form.type===t?col:'var(--border)'}`,
                            background:form.type===t?`${col}33`:'none',
                            color:form.type===t?col:'var(--text-dim)',
                            fontFamily:'var(--display)',fontSize:16,fontWeight:600,
                            textTransform:'uppercase',letterSpacing:'0.06em'}}>
                    {t}
                  </button>
                )
              })}
            </div>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
              placeholder="Name" onKeyDown={e=>e.key==='Enter'&&addCombatant()}
              style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:5,
                      padding:'7px 10px',color:'var(--text)',fontFamily:'var(--body)',fontSize:15,outline:'none'}}/>
            {form.type==='player' && chars.length>0 && (
              <select value={form.charId}
                onChange={e=>{const c=chars.find((ch:any)=>ch.id===e.target.value);setForm(f=>({...f,charId:e.target.value,name:c?c.name:f.name}))}}
                style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:5,
                        padding:'7px 10px',color:'var(--text)',fontFamily:'var(--body)',fontSize:15,outline:'none',cursor:'pointer'}}>
                <option value="">— Link character sheet (optional) —</option>
                {chars.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            <div style={{display:'flex',gap:8}}>
              {[['Wound Threshold','wt'],['Strain Threshold','st']].map(([lbl,k])=>(
                <div key={k} style={{flex:1}}>
                  <div style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',marginBottom:3}}>{lbl}</div>
                  <input type="number" min={1} max={40} value={(form as any)[k]}
                    onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                    style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:5,
                            padding:'7px 10px',color:'var(--text)',fontFamily:'var(--body)',fontSize:15,outline:'none'}}/>
                </div>
              ))}
            </div>
            <Btn variant="primary" style={{width:'100%',padding:'9px'}} onClick={addCombatant}>
              Add to Initiative
            </Btn>
          </div>

          {/* Dice roller */}
          <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8,padding:14}}>
            <div style={{fontFamily:'var(--display)',fontSize:16,fontWeight:700,letterSpacing:'0.1em',
                         textTransform:'uppercase',color:'var(--text-dim)',marginBottom:10}}>Dice Roller</div>
            <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:10}}>
              {DIE_BTNS.map(d=>(
                <button key={d.key} onClick={()=>setPool(p=>({...p,[d.key]:(p as any)[d.key]+1}))}
                  style={{padding:'5px 9px',borderRadius:5,border:`1px solid ${d.col}66`,cursor:'pointer',
                          background:(pool as any)[d.key]>0?`${d.col}22`:'none',color:d.col,
                          fontFamily:'var(--display)',fontSize:16,fontWeight:600}}>
                  {(pool as any)[d.key]>0?`${d.label} ×${(pool as any)[d.key]}`:d.label}
                </button>
              ))}
            </div>
            <div style={{display:'flex',gap:6,marginBottom:10}}>
              <Btn variant="primary" style={{flex:1,padding:8}} onClick={roll}>Roll</Btn>
              <Btn style={{padding:'8px 12px'}} onClick={()=>{setPool({ability:0,proficiency:0,difficulty:0,challenge:0,boost:0,setback:0});setResult(null)}}>Clear</Btn>
            </div>
            <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,padding:12,minHeight:72}}>
              {!result && <span style={{color:'var(--text-dim)',fontFamily:'var(--mono)',fontSize:16}}>Roll result will appear here</span>}
              {result && (
                <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
                  {result.s>0  && <RV val={`+${result.s}`}  lbl="Success"   col="#4CAF50"/>}
                  {result.f>0  && <RV val={`−${result.f}`}  lbl="Failure"   col="var(--red)"/>}
                  {result.a>0  && <RV val={`+${result.a}`}  lbl="Advantage" col="var(--cyan)"/>}
                  {result.th>0 && <RV val={`−${result.th}`} lbl="Threat"    col="#FF9800"/>}
                  {result.t>0  && <RV val={`★ ${result.t}`} lbl="Triumph"   col="#FFD700"/>}
                  {result.d>0  && <RV val={`✕ ${result.d}`} lbl="Despair"   col="var(--red)"/>}
                  {Object.values(result).every(v=>v===0) && <span style={{color:'var(--text-dim)'}}>No net result</span>}
                </div>
              )}
            </div>
          </div>

          {/* Combat log */}
          <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8,padding:12}}>
            <div style={{fontFamily:'var(--display)',fontSize:15,fontWeight:700,letterSpacing:'0.1em',
                         textTransform:'uppercase',color:'var(--text-dim)',marginBottom:8}}>Combat Log</div>
            <div style={{display:'flex',flexDirection:'column',gap:3,maxHeight:180,overflowY:'auto'}}>
              {(data.log||[]).map((e:any)=>(
                <div key={e.id} style={{fontSize:15,fontFamily:'var(--mono)',padding:'3px 0',
                                        borderBottom:'1px solid rgba(255,255,255,0.04)',
                                        color:e.type==='important'?'var(--gold)':e.type==='danger'?'var(--red)':'var(--text-dim)'}}>
                  <span style={{opacity:0.5,marginRight:6}}>{String(e.time||'').slice(11,16)}</span>
                  {e.message}
                </div>
              ))}
              {(data.log||[]).length===0 && <div style={{fontSize:15,color:'var(--text-dim)',fontFamily:'var(--mono)'}}>No entries yet.</div>}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function RV({ val, lbl, col }: { val:string; lbl:string; col:string }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
      <div style={{fontFamily:'var(--display)',fontSize:25,fontWeight:700,color:col}}>{val}</div>
      <div style={{fontSize:14,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-dim)'}}>{lbl}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHIP STAT BLOCK + SHIPS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function ShipStatBlock({ shipKey }: { shipKey: string }) {
  const s = SHIP_STATS[shipKey]
  if (!s) return null
  const catColor = (c:string) => {
    if (c==='PLAYER SHIP') return 'var(--gold)'
    if (c==='CAPITAL SHIP') return '#ef5350'
    if (c==='REBEL VESSEL') return '#66bb6a'
    if (c==='STARFIGHTER') return '#4fc3f7'
    if (c==='BOMBER') return '#ff7043'
    if (c==='ASSAULT GUNSHIP') return '#ff9800'
    if (c==='TRANSPORT') return '#90a4ae'
    if (c==='PATROL / CORVETTE') return '#ce93d8'
    return '#78909c'
  }
  const col = catColor(s.category)
  return (
    <div style={{padding:'20px 24px',overflowY:'auto',height:'100%',fontFamily:'var(--body)'}}>
      {/* Header */}
      <div style={{marginBottom:16}}>
        <div style={{fontFamily:'var(--mono)',fontSize:14,color:col,textTransform:'uppercase',
                     letterSpacing:'0.12em',marginBottom:4}}>{s.category}</div>
        <div style={{fontFamily:'var(--display)',fontSize:26,fontWeight:700,color:'var(--text-bright)',
                     lineHeight:1.1,marginBottom:2}}>{s.name}</div>
        <div style={{fontSize:16,color:'var(--text-dim)'}}>{s.manufacturer} — {s.model}</div>
      </div>

      {/* Core stats bar */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6,marginBottom:16}}>
        {([['SIL',s.silhouette],['SPD',s.speed],['HND',s.handling],['DEF F',s.defFore],
           ['DEF A',s.defAft],['ARMR',s.armour],['HT/SST',`${s.hullTrauma}/${s.systemStrain}`]] as [string,any][]).map(([lbl,val])=>(
          <div key={lbl} style={{background:'var(--panel2)',border:'1px solid var(--border2)',
                                  borderRadius:4,padding:'8px 6px',textAlign:'center'}}>
            <div style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--text-dim)',
                         textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:3}}>{lbl}</div>
            <div style={{fontFamily:'var(--display)',fontSize:20,fontWeight:700,
                         color:lbl==='HND'&&s.handling<0?'#ef5350':'var(--text-bright)'}}>{val}</div>
          </div>
        ))}
      </div>

      {/* Info row */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16,
                   background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:12}}>
        <div><span style={{color:'var(--text-dim)',fontSize:14}}>Hyperdrive: </span>
             <span style={{fontSize:14,color:'var(--text-bright)'}}>{s.hyperdrive}</span></div>
        <div><span style={{color:'var(--text-dim)',fontSize:14}}>Consumables: </span>
             <span style={{fontSize:14,color:'var(--text-bright)'}}>{s.consumables}</span></div>
        <div><span style={{color:'var(--text-dim)',fontSize:14}}>Complement: </span>
             <span style={{fontSize:14,color:'var(--text-bright)'}}>{s.complement}</span></div>
      </div>

      {/* Weapons */}
      {s.weapons.length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{fontFamily:'var(--mono)',fontSize:14,color:'var(--text-dim)',
                       textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>Weapons</div>
          <div style={{border:'1px solid var(--border)',borderRadius:6,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 2fr',
                         background:'var(--panel2)',padding:'6px 10px',
                         fontFamily:'var(--mono)',fontSize:13,color:'var(--text-dim)',
                         textTransform:'uppercase',letterSpacing:'0.08em',gap:8}}>
              <span>Name</span><span>Fire Arc</span><span>Dmg</span><span>Crit</span><span>Range</span><span>Qualities</span>
            </div>
            {s.weapons.map((w,i)=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 2fr',
                                   padding:'7px 10px',gap:8,
                                   background:i%2===0?'transparent':'rgba(255,255,255,0.02)',
                                   borderTop:'1px solid var(--border)',fontSize:15,color:'var(--text)'}}>
                <span>{w.name}</span>
                <span style={{color:'var(--text-dim)'}}>{w.fire}</span>
                <span style={{color:'#ef5350'}}>{w.damage}</span>
                <span style={{color:'#E67E22'}}>{w.critical || '—'}</span>
                <span style={{color:'var(--text-dim)'}}>{w.range}</span>
                <span style={{color:'var(--text-dim)',fontSize:14}}>{w.qualities || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special Abilities */}
      {s.abilities.length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{fontFamily:'var(--mono)',fontSize:14,color:'var(--text-dim)',
                       textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>Special Abilities</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {s.abilities.map((a,i)=>{
              const [title,...rest] = a.split(':')
              return (
                <div key={i} style={{background:'var(--panel)',border:'1px solid var(--border)',
                                      borderLeft:`3px solid ${col}`,borderRadius:4,padding:'8px 12px',
                                      fontSize:15}}>
                  {rest.length>0
                    ? <><span style={{color:col,fontWeight:600}}>{title}:</span>
                        <span style={{color:'var(--text-dim)'}}>{rest.join(':')}</span></>
                    : <span style={{color:'var(--text-dim)'}}>{a}</span>
                  }
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Description */}
      <div style={{background:'var(--panel)',border:'1px solid var(--border)',
                   borderRadius:6,padding:'12px 14px',fontSize:16,
                   color:'var(--text-dim)',lineHeight:1.6,fontStyle:'italic'}}>
        {s.desc}
      </div>
    </div>
  )
}

function ShipsView() {
  const [search,     setSearch]     = useState('')
  const [catFilter,  setCatFilter]  = useState('ALL')
  const [selectedKey,setSelectedKey]= useState<string|null>(null)

  const filtered = Object.entries(SHIP_STATS).filter(([,ship]) => {
    const matchCat  = catFilter==='ALL' || ship.category===catFilter
    const matchText = search==='' || ship.name.toLowerCase().includes(search.toLowerCase()) ||
                      ship.model.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchText
  })

  const catColor = (c:string) => {
    if (c==='PLAYER SHIP') return 'var(--gold)'
    if (c==='CAPITAL SHIP') return '#ef5350'
    if (c==='REBEL VESSEL') return '#66bb6a'
    if (c==='STARFIGHTER') return '#4fc3f7'
    if (c==='BOMBER') return '#ff7043'
    if (c==='ASSAULT GUNSHIP') return '#ff9800'
    if (c==='TRANSPORT') return '#90a4ae'
    if (c==='PATROL / CORVETTE') return '#ce93d8'
    return '#78909c'
  }

  return (
    <div style={{display:'flex',height:'100%',overflow:'hidden'}}>
      {/* Left panel — ship list */}
      <div style={{width:280,flexShrink:0,borderRight:'1px solid var(--border2)',
                   display:'flex',flexDirection:'column',background:'var(--bg2)'}}>
        {/* Search */}
        <div style={{padding:'12px 12px 8px'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search ships…"
            style={{width:'100%',background:'var(--panel)',border:'1px solid var(--border2)',
                    borderRadius:4,padding:'7px 10px',fontSize:16,color:'var(--text)',
                    outline:'none',fontFamily:'var(--body)'}}/>
        </div>
        {/* Category filter */}
        <div style={{padding:'0 12px 10px',display:'flex',flexWrap:'wrap',gap:4}}>
          {SHIP_CATEGORIES.map(c=>(
            <button key={c} onClick={()=>setCatFilter(c)}
              style={{padding:'3px 8px',fontSize:13,borderRadius:3,cursor:'pointer',
                      fontFamily:'var(--mono)',letterSpacing:'0.05em',
                      background:catFilter===c?catColor(c):'var(--panel)',
                      color:catFilter===c?'#000':'var(--text-dim)',
                      border:`1px solid ${catFilter===c?catColor(c):'var(--border)'}`,
                      fontWeight:catFilter===c?700:400}}>
              {c==='ALL'?'All':c}
            </button>
          ))}
        </div>
        {/* Ship list */}
        <div style={{flex:1,overflowY:'auto'}}>
          {filtered.map(([key,ship])=>(
            <div key={key} onClick={()=>setSelectedKey(key)}
              style={{padding:'9px 14px',cursor:'pointer',
                      borderLeft:`3px solid ${selectedKey===key?catColor(ship.category):'transparent'}`,
                      background:selectedKey===key?'rgba(255,255,255,0.04)':'transparent',
                      borderBottom:'1px solid var(--border)'}}>
              <div style={{fontSize:16,color:selectedKey===key?'var(--text-bright)':'var(--text)',
                           fontWeight:selectedKey===key?600:400,lineHeight:1.2}}>{ship.name}</div>
              <div style={{marginTop:3,display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontFamily:'var(--mono)',fontSize:13,padding:'1px 5px',borderRadius:2,
                              background:`${catColor(ship.category)}20`,color:catColor(ship.category),
                              border:`1px solid ${catColor(ship.category)}40`}}>
                  {ship.category}
                </span>
                <span style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--text-dim)'}}>
                  SIL {ship.silhouette}
                </span>
              </div>
            </div>
          ))}
          {filtered.length===0 && (
            <div style={{padding:24,textAlign:'center',color:'var(--text-dim)',fontSize:16}}>
              No ships match your search.
            </div>
          )}
        </div>
      </div>

      {/* Right panel — stat block */}
      <div style={{flex:1,overflow:'hidden'}}>
        {selectedKey
          ? <ShipStatBlock shipKey={selectedKey}/>
          : (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                         height:'100%',color:'var(--text-dim)',fontFamily:'var(--mono)',gap:12}}>
              <span style={{fontSize:36,opacity:0.3}}>◉</span>
              <span style={{fontSize:16,letterSpacing:'0.12em',textTransform:'uppercase'}}>
                Select a vessel to view its dossier
              </span>
            </div>
          )
        }
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CRITICAL INJURY TRACKER CARD
// ─────────────────────────────────────────────────────────────────────────────
function CritInjuryCard({ title, injuries, table, isShip, col, onAdd, onRemove }:
  { title:string; injuries:any[]; table:typeof CREW_CRIT; isShip:boolean; col?:number;
    onAdd:(inj:any)=>void; onRemove:(id:string)=>void }) {
  const [roll,      setRoll]      = useState('')
  const [character, setCharacter] = useState('')
  const [showTable, setShowTable] = useState(false)

  const rollNum = parseInt(roll)
  const preview = !isNaN(rollNum) && rollNum > 0
    ? (table.find(c => rollNum >= c.lo && rollNum <= c.hi) ?? table[table.length-1])
    : null

  const sevColor = (s:number) =>
    s >= 5 ? '#922B21' : s >= 4 ? '#922B21' : s >= 3 ? 'var(--red)' : s >= 2 ? '#D35400' : '#E67E22'

  const canAdd = !!preview && (isShip || character.trim().length > 0)

  return (
    <GmCard title={title} col={col??1}>
      {/* Add form */}
      <div style={{display:'flex',gap:6,marginBottom:8,flexWrap:'wrap',alignItems:'center'}}>
        {!isShip && (
          <input value={character} onChange={e=>setCharacter(e.target.value)} placeholder="Character name"
            style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:4,padding:'5px 9px',
                    color:'var(--text)',fontFamily:'var(--mono)',fontSize:16,flex:1,minWidth:90,outline:'none'}}/>
        )}
        <input value={roll} onChange={e=>setRoll(e.target.value)} placeholder="d100" type="number" min={1} max={999}
          style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:4,padding:'5px 9px',
                  color:'var(--text)',fontFamily:'var(--mono)',fontSize:16,width:80,outline:'none'}}/>
        <button onClick={()=>setRoll(String(Math.floor(Math.random()*100)+1))}
          style={{padding:'5px 11px',borderRadius:4,border:'1px solid var(--border2)',background:'var(--panel)',
                  color:'var(--text-dim)',fontFamily:'var(--mono)',fontSize:16,cursor:'pointer'}}>
          Roll
        </button>
        <button disabled={!canAdd} onClick={()=>{
            if (!preview || (!isShip && !character.trim())) return
            onAdd({id:Date.now().toString(),...(!isShip?{character}:{}),roll:rollNum,...preview})
            setRoll(''); setCharacter('')
          }}
          style={{padding:'5px 11px',borderRadius:4,
                  border:`1px solid ${canAdd?'rgba(212,172,13,0.5)':'var(--border)'}`,
                  background:canAdd?'rgba(212,172,13,0.1)':'var(--panel)',
                  color:canAdd?'var(--gold)':'var(--text-dim)',
                  fontFamily:'var(--display)',fontSize:16,fontWeight:700,cursor:canAdd?'pointer':'default'}}>
          Add
        </button>
      </div>

      {/* Roll preview */}
      {preview && (
        <div style={{marginBottom:10,padding:'7px 11px',borderRadius:4,
                     background:sevColor(preview.sev)+'22',border:`1px solid ${sevColor(preview.sev)}55`}}>
          <span style={{color:sevColor(preview.sev),fontFamily:'var(--display)',fontWeight:700,fontSize:15}}>
            {preview.name}{' '}
          </span>
          <span style={{color:'var(--text-dim)',fontFamily:'var(--mono)',fontSize:15}}>{preview.eff}</span>
        </div>
      )}

      {/* Active injuries */}
      {injuries.length === 0 ? (
        <div style={{color:'var(--text-dim)',fontFamily:'var(--mono)',fontSize:16,
                     textAlign:'center',padding:'12px 0',borderTop:'1px solid var(--border)'}}>
          No active {isShip ? 'critical hits' : 'critical injuries'}
        </div>
      ) : injuries.map((inj:any) => (
        <div key={inj.id} style={{display:'flex',gap:8,alignItems:'flex-start',padding:'7px 9px',
                                   marginBottom:5,background:'rgba(255,255,255,0.02)',
                                   border:'1px solid var(--border)',borderRadius:5}}>
          {!isShip && (
            <span style={{color:'var(--gold)',fontFamily:'var(--display)',fontSize:16,
                          flexShrink:0,minWidth:70,paddingTop:1}}>{inj.character}</span>
          )}
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:sevColor(inj.sev),fontFamily:'var(--display)',fontWeight:600,fontSize:16}}>
              {inj.name}
            </div>
            <div style={{color:'var(--text-dim)',fontFamily:'var(--mono)',fontSize:15,lineHeight:1.4}}>
              {inj.eff}
            </div>
          </div>
          <button onClick={()=>onRemove(inj.id)}
            style={{background:'none',border:'none',color:'var(--text-dim)',
                    fontSize:19,cursor:'pointer',lineHeight:1,flexShrink:0,paddingTop:0}}>
            ×
          </button>
        </div>
      ))}

      {/* Reference table toggle */}
      <button onClick={()=>setShowTable(s=>!s)}
        style={{marginTop:8,width:'100%',padding:'5px',borderRadius:4,border:'1px solid var(--border)',
                background:'none',color:'var(--text-dim)',fontFamily:'var(--mono)',fontSize:15,cursor:'pointer'}}>
        {showTable ? 'Hide' : 'Show'} Reference Table
      </button>
      {showTable && (
        <div style={{marginTop:6,maxHeight:280,overflowY:'auto',border:'1px solid var(--border)',borderRadius:4}}>
          {table.map((row,i) => (
            <div key={i} style={{display:'flex',gap:8,padding:'4px 9px',alignItems:'baseline',
                                  borderBottom:i<table.length-1?'1px solid rgba(255,255,255,0.04)':'none',
                                  background:i%2===0?'rgba(255,255,255,0.01)':'transparent'}}>
              <span style={{fontFamily:'var(--mono)',fontSize:14,color:'var(--text-dim)',
                            minWidth:58,flexShrink:0}}>
                {row.lo}{row.lo!==row.hi?`–${row.hi}`:''}
              </span>
              <span style={{fontFamily:'var(--display)',fontWeight:600,fontSize:15,
                            color:sevColor(row.sev),minWidth:130,flexShrink:0}}>
                {row.name}
              </span>
              <span style={{fontFamily:'var(--mono)',fontSize:14,color:'var(--text-dim)',flex:1}}>
                {row.eff}
              </span>
            </div>
          ))}
        </div>
      )}
    </GmCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GM DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function GMDashboard() {
  const [state, setState] = useState<any>(INITIAL_CAMPAIGN)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const debounced = useDebounce(state, 1000)

  useEffect(()=>{
    api('/api/campaign').then(d=>{setState(d);setLoading(false)}).catch(()=>setLoading(false))
  },[])

  useEffect(()=>{
    if(loading) return
    setSaving(true)
    api('/api/campaign','PUT',debounced).finally(()=>setSaving(false))
  },[debounced])

  const upd = (k:string,v:any) => setState((s:any)=>({...s,[k]:v}))

  const duty: number          = state.duty ?? 0
  const tier: number          = state.tier ?? 1
  const crewCriticals: any[]  = state.crewCriticals ?? []
  const shipCriticals: any[]  = state.shipCriticals ?? []
  const dutyThresholdMet      = duty >= 100

  if(loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--text-dim)',fontFamily:'var(--mono)'}}>
      Loading campaign data…
    </div>
  )

  return (
    <div style={{height:'100%',overflowY:'auto',padding:20,position:'relative'}}>
      {saving && (
        <div style={{position:'fixed',top:60,right:16,background:'rgba(212,172,13,0.15)',
                     border:'1px solid rgba(212,172,13,0.4)',borderRadius:6,padding:'6px 12px',
                     fontSize:16,color:'var(--gold)',fontFamily:'var(--mono)',zIndex:99}}>
          Saving…
        </div>
      )}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,maxWidth:1200,margin:'0 auto'}}>

        {/* ── Heat Track ── */}
        <GmCard title="Heat Track">
          <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:10}}>
            {Array.from({length:10}).map((_,i)=>{
              const on=i<state.heatLevel
              const bg=on?(i>=7?'var(--red)':'#E67E22'):'rgba(255,255,255,0.04)'
              return (
                <div key={i} onClick={()=>upd('heatLevel',state.heatLevel===i+1?i:i+1)}
                  style={{width:26,height:26,borderRadius:4,border:'1px solid var(--border2)',cursor:'pointer',
                          background:bg,display:'flex',alignItems:'center',justifyContent:'center',
                          fontFamily:'var(--mono)',fontSize:15,color:on?'white':'transparent',
                          boxShadow:on?`0 0 6px ${i>=7?'rgba(192,57,43,0.4)':'rgba(230,126,34,0.4)'}`:''}}>{i+1}</div>
              )
            })}
          </div>
          {[['1–2','Cold — Normal operations'],['3–4','Warm — Checkpoints tighten'],
            ['5–6','Hot — Renaus hunting'],['7–8','Burning — ISB active'],['9–10','Inferno — Full manhunt']].map(([r,e])=>(
            <div key={r} style={{display:'flex',gap:8,marginBottom:5,alignItems:'center'}}>
              <span style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--red)',minWidth:32}}>{r}</span>
              <span style={{fontSize:16,color:'var(--text-dim)'}}>{e}</span>
            </div>
          ))}
          <div style={{marginTop:12,paddingTop:12,borderTop:'1px solid var(--border)'}}>
            <div style={{fontFamily:'var(--display)',fontSize:16,fontWeight:700,letterSpacing:'0.08em',
                         textTransform:'uppercase',color:'var(--gold)',marginBottom:8}}>Renaus Track</div>
            <div style={{display:'flex',gap:6}}>
              {Array.from({length:5}).map((_,i)=>(
                <div key={i} onClick={()=>upd('renausTrack',state.renausTrack===i+1?i:i+1)}
                  style={{width:34,height:34,borderRadius:4,border:'1px solid var(--border2)',cursor:'pointer',
                          background:i<state.renausTrack?'#FF9800':'rgba(255,255,255,0.04)',
                          display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:15,fontFamily:'var(--mono)',color:i<state.renausTrack?'white':'transparent',
                          boxShadow:i<state.renausTrack?'0 0 6px rgba(255,152,0,0.4)':''}}>□{i+1}</div>
              ))}
            </div>
            <div style={{fontSize:15,color:'var(--text-dim)',fontFamily:'var(--mono)',marginTop:6,lineHeight:1.6}}>
              □3 = Active hunt  □4 = Profile known  □5 = Full manhunt
            </div>
          </div>
        </GmCard>

        {/* ── Moral Ledger ── */}
        <GmCard title="Moral Ledger">
          {([['MERCY','mercyCount','var(--green-bright)'],
             ['EXPEDIENCY','expedCount','var(--red)']] as [string,string,string][]).map(([lbl,key,col])=>(
            <div key={key} style={{marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <span style={{fontSize:15,color:col,minWidth:90,fontFamily:'var(--display)',fontWeight:600}}>{lbl}</span>
                <span style={{fontFamily:'var(--mono)',fontSize:15,color:col,marginLeft:'auto'}}>{(state as any)[key]}</span>
              </div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {Array.from({length:10}).map((_,i)=>(
                  <div key={i} onClick={()=>upd(key,(state as any)[key]===i+1?i:i+1)}
                    style={{width:20,height:20,borderRadius:3,border:'1px solid var(--border2)',cursor:'pointer',
                            background:i<(state as any)[key]?col:'rgba(255,255,255,0.04)',
                            boxShadow:i<(state as any)[key]?`0 0 4px ${col}66`:'',transition:'all 0.15s'}}/>
                ))}
              </div>
            </div>
          ))}
          {(()=>{
            const d=state.mercyCount-state.expedCount
            const txt=d>=3?'Ewoks ally. Verath hesitates.':d<=-3?'No Ewoks. Verath does not hesitate.':'Ewoks cautious. Triumph for Verath hesitation.'
            const col=d>=3?'var(--green-bright)':d<=-3?'var(--red)':'var(--gold)'
            return (
              <div style={{background:'var(--bg3)',border:`1px solid ${col}40`,borderRadius:6,padding:10,marginTop:4}}>
                <div style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',marginBottom:4,
                             textTransform:'uppercase',letterSpacing:'0.08em'}}>Act III Outcome</div>
                <div style={{fontSize:16,color:col,lineHeight:1.5}}>{txt}</div>
              </div>
            )
          })()}
        </GmCard>

        {/* ── Duty Tracker ── */}
        <GmCard title="Duty Tracker">
          <div style={{textAlign:'center',marginBottom:12}}>
            <div style={{fontFamily:'var(--display)',fontSize:54,fontWeight:700,color:'var(--gold)',lineHeight:1}}>
              {duty}
            </div>
            <div style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--text-dim)',marginTop:3}}>
              / 100 threshold
            </div>
            <div style={{background:'rgba(255,255,255,0.06)',borderRadius:4,height:5,margin:'8px 0 4px',overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:4,transition:'width 0.4s',
                           width:`${Math.min(100,(duty/100)*100)}%`,
                           background:dutyThresholdMet?'var(--green-bright)':'var(--gold)'}}/>
            </div>
            {dutyThresholdMet && (
              <div style={{marginTop:6,padding:'4px 10px',background:'rgba(39,174,96,0.15)',
                           border:'1px solid var(--green-bright)',borderRadius:4,display:'inline-block',
                           color:'var(--green-bright)',fontFamily:'var(--mono)',fontSize:15,
                           fontWeight:700,letterSpacing:'0.1em'}}>
                ✓ THRESHOLD MET
              </div>
            )}
          </div>

          <div style={{display:'flex',gap:5,justifyContent:'center',flexWrap:'wrap',marginBottom:10}}>
            {([1,5,10,-1,-5] as number[]).map(n=>(
              <button key={n} onClick={()=>upd('duty',Math.max(0,duty+n))}
                style={{padding:'4px 10px',borderRadius:4,fontFamily:'var(--mono)',fontSize:16,cursor:'pointer',
                        border:`1px solid ${n>0?'rgba(212,172,13,0.4)':'rgba(192,57,43,0.4)'}`,
                        background:n>0?'rgba(212,172,13,0.08)':'rgba(192,57,43,0.08)',
                        color:n>0?'var(--gold)':'var(--red)'}}>
                {n>0?`+${n}`:n}
              </button>
            ))}
          </div>

          {dutyThresholdMet && (
            <button onClick={()=>setState((s:any)=>({...s,duty:Math.max(0,(s.duty??0)-100),tier:(s.tier??1)+1}))}
              style={{width:'100%',padding:'9px',borderRadius:5,border:'1px solid var(--green-bright)',
                      background:'rgba(39,174,96,0.15)',color:'var(--green-bright)',
                      fontFamily:'var(--display)',fontSize:15,fontWeight:700,
                      letterSpacing:'0.08em',cursor:'pointer',marginBottom:10}}>
              SPEND DUTY — Advance to Tier {tier + 1}
            </button>
          )}

          <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:5,
                       padding:'8px 12px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',
                           textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:2}}>Current Tier</div>
              <div style={{fontFamily:'var(--display)',fontSize:30,fontWeight:700,color:'var(--text-bright)',lineHeight:1}}>
                {tier}
              </div>
            </div>
            <div style={{display:'flex',gap:5}}>
              <SBtn onClick={()=>upd('tier',Math.max(1,tier-1))}>−</SBtn>
              <SBtn onClick={()=>upd('tier',tier+1)}>+</SBtn>
            </div>
          </div>
        </GmCard>

        {/* ── GM Notes ── */}
        <GmCard title={`GM Notes — Session ${state.session ?? 1}`} col={2}>
          <div style={{display:'flex',gap:6,marginBottom:8,alignItems:'center'}}>
            <div style={{fontSize:15,fontFamily:'var(--mono)',color:'var(--text-dim)'}}>Session</div>
            <SBtn onClick={()=>upd('session',Math.max(1,(state.session??1)-1))}>−</SBtn>
            <div style={{fontFamily:'var(--display)',fontSize:21,fontWeight:700,color:'var(--gold)',minWidth:24,textAlign:'center'}}>
              {state.session ?? 1}
            </div>
            <SBtn onClick={()=>upd('session',(state.session??1)+1)}>+</SBtn>
          </div>
          <textarea value={state.gmNotes||''} onChange={(e:any)=>upd('gmNotes',e.target.value)}
            style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,
                    padding:10,color:'var(--text)',fontFamily:'var(--body)',fontSize:15,
                    resize:'vertical',outline:'none',minHeight:140,lineHeight:1.6}}
            placeholder="Session notes, NPC states, ongoing threads, player decisions to remember..."/>
        </GmCard>

        {/* ── Player Accounts ── */}
        <GmCard title="Player Accounts">
          <PlayerAccountsCard/>
        </GmCard>

        {/* ── Critical Injuries — Crew ── */}
        <CritInjuryCard
          title="Critical Injuries — Crew"
          injuries={crewCriticals}
          table={CREW_CRIT}
          isShip={false}
          col={2}
          onAdd={(inj:any)=>upd('crewCriticals',[...crewCriticals,inj])}
          onRemove={(id:string)=>upd('crewCriticals',crewCriticals.filter((c:any)=>c.id!==id))}
        />

        {/* ── Critical Hits — Ship ── */}
        <CritInjuryCard
          title="Critical Hits — Ship"
          injuries={shipCriticals}
          table={SHIP_CRIT}
          isShip={true}
          col={1}
          onAdd={(inj:any)=>upd('shipCriticals',[...shipCriticals,inj])}
          onRemove={(id:string)=>upd('shipCriticals',shipCriticals.filter((c:any)=>c.id!==id))}
        />

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (auth: {id:string,username:string,role:string,characterId:string}) => void }) {
  const [mode, setMode]         = useState<'login'|'signup'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  function switchMode(m: 'login'|'signup') {
    setMode(m); setError(''); setPassword(''); setConfirm('')
  }

  async function submit(e: { preventDefault(): void }) {
    e.preventDefault()
    setError('')
    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match'); return
    }
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup'
      const res  = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({username, password}),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || (mode==='login' ? 'Login failed' : 'Sign up failed')); setLoading(false); return }
      onLogin(data)
    } catch {
      setError('Network error — check your connection')
      setLoading(false)
    }
  }

  return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
                 background:'var(--bg)',flexDirection:'column',gap:0}}>
      <div style={{fontFamily:'var(--display)',fontSize:25,fontWeight:700,color:'var(--gold)',
                   letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:6}}>
        Operation: <span style={{color:'var(--red)'}}>Silent</span> Running
      </div>
      <div style={{fontFamily:'var(--mono)',fontSize:16,color:'var(--text-dim)',
                   letterSpacing:'0.12em',marginBottom:32}}>SECURE ACCESS TERMINAL</div>

      {/* Mode toggle */}
      <div style={{display:'flex',marginBottom:0,width:320,background:'var(--bg3)',
                   border:'1px solid var(--border)',borderRadius:'8px 8px 0 0',overflow:'hidden'}}>
        {(['login','signup'] as const).map(m => (
          <button key={m} onClick={()=>switchMode(m)} type="button"
            style={{flex:1,padding:'9px 0',fontFamily:'var(--mono)',fontSize:16,fontWeight:600,
                    letterSpacing:'0.1em',textTransform:'uppercase',border:'none',cursor:'pointer',
                    background: mode===m ? 'var(--panel)' : 'transparent',
                    color: mode===m ? 'var(--gold)' : 'var(--text-dim)',
                    borderBottom: mode===m ? '2px solid var(--gold)' : '2px solid transparent'}}>
            {m==='login' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      <form onSubmit={submit}
        style={{background:'var(--panel)',border:'1px solid var(--border)',borderTop:'none',
                borderRadius:'0 0 10px 10px',padding:'24px 32px 28px',width:320,
                display:'flex',flexDirection:'column',gap:16}}>
        <div>
          <div style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--text-dim)',
                       letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>Username</div>
          <input value={username} onChange={e=>setUsername(e.target.value)}
            autoFocus autoComplete="username"
            style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,
                    padding:'9px 12px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:16,
                    outline:'none',boxSizing:'border-box'}}/>
        </div>
        <div>
          <div style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--text-dim)',
                       letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>Password</div>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
            autoComplete={mode==='login' ? 'current-password' : 'new-password'}
            style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,
                    padding:'9px 12px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:16,
                    outline:'none',boxSizing:'border-box'}}/>
        </div>
        {mode === 'signup' && (
          <div>
            <div style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--text-dim)',
                         letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>Confirm Password</div>
            <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}
              autoComplete="new-password"
              style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,
                      padding:'9px 12px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:16,
                      outline:'none',boxSizing:'border-box'}}/>
          </div>
        )}
        {mode === 'signup' && (
          <div style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--text-dim)',
                       lineHeight:1.6,padding:'6px 8px',background:'rgba(255,255,255,0.03)',
                       borderRadius:5,border:'1px solid var(--border)'}}>
            New accounts have <span style={{color:'var(--text)'}}>player access</span> — galaxy map &amp; your character only.
            Your GM will link your character after you sign up.
          </div>
        )}
        {error && (
          <div style={{fontFamily:'var(--mono)',fontSize:16,color:'var(--red)',
                       background:'rgba(192,57,43,0.1)',border:'1px solid rgba(192,57,43,0.3)',
                       borderRadius:5,padding:'7px 10px'}}>{error}</div>
        )}
        <button type="submit" disabled={loading}
          style={{marginTop:4,padding:'10px',borderRadius:6,border:'1px solid rgba(212,172,13,0.5)',
                  background:'rgba(212,172,13,0.12)',color:'var(--gold)',fontFamily:'var(--display)',
                  fontSize:16,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',
                  cursor:loading?'wait':'pointer',opacity:loading?0.6:1}}>
          {loading ? (mode==='login' ? 'Authenticating…' : 'Creating Account…') : (mode==='login' ? 'Sign In' : 'Create Account')}
        </button>
      </form>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAYER ACCOUNTS (GM-only panel inside GMDashboard)
// ─────────────────────────────────────────────────────────────────────────────
function PlayerAccountsCard() {
  const [users, setUsers]   = useState<any[]>([])
  const [chars, setChars]   = useState<any[]>([])
  const [form, setForm]     = useState({username:'',password:'',characterId:''})
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api('/api/auth/users'), api('/api/characters')])
      .then(([u,c]) => { setUsers(u); setChars(c); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function createUser() {
    if (!form.username || !form.password) { setError('Username and password required'); return }
    setError('')
    try {
      await api('/api/auth/users','POST',{...form, role:'player'})
      const u = await api('/api/auth/users')
      setUsers(u)
      setForm({username:'',password:'',characterId:''})
    } catch (e: any) { setError(e.message) }
  }

  async function deleteUser(id: string) {
    await api(`/api/auth/users/${id}`,'DELETE')
    setUsers(u=>u.filter((x:any)=>x.id!==id))
  }

  async function linkChar(userId: string, characterId: string) {
    await api(`/api/auth/users/${userId}`,'PATCH',{characterId})
    setUsers(u=>u.map((x:any)=>x.id===userId?{...x,character_id:characterId}:x))
  }

  if (loading) return <div style={{padding:12,color:'var(--text-dim)',fontFamily:'var(--mono)',fontSize:16}}>Loading…</div>

  return (
    <div>
      {/* Existing users */}
      {users.filter((u:any)=>u.role==='player').length===0 && (
        <div style={{fontFamily:'var(--mono)',fontSize:16,color:'var(--text-dim)',marginBottom:12}}>No player accounts yet.</div>
      )}
      {users.filter((u:any)=>u.role==='player').map((u:any) => (
        <div key={u.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',
                                borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
          <span style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--text-bright)',flex:'0 0 100px'}}>{u.username}</span>
          <select value={u.character_id||''} onChange={e=>linkChar(u.id,e.target.value)}
            style={{flex:1,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:4,
                    padding:'4px 6px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:16}}>
            <option value=''>— no character —</option>
            {chars.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={()=>deleteUser(u.id)}
            style={{background:'none',border:'none',color:'var(--red)',fontSize:17,cursor:'pointer',flexShrink:0}}>×</button>
        </div>
      ))}

      {/* Create player */}
      <div style={{marginTop:14,display:'flex',gap:8,flexWrap:'wrap',alignItems:'flex-end'}}>
        <input placeholder="username" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))}
          style={{flex:'1 1 90px',minWidth:80,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:4,
                  padding:'6px 8px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:16}}/>
        <input placeholder="password" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
          style={{flex:'1 1 90px',minWidth:80,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:4,
                  padding:'6px 8px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:16}}/>
        <select value={form.characterId} onChange={e=>setForm(f=>({...f,characterId:e.target.value}))}
          style={{flex:'1 1 110px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:4,
                  padding:'6px 8px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:16}}>
          <option value=''>— no character —</option>
          {chars.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={createUser}
          style={{padding:'6px 14px',borderRadius:4,border:'1px solid rgba(212,172,13,0.4)',
                  background:'rgba(212,172,13,0.1)',color:'var(--gold)',fontFamily:'var(--display)',
                  fontSize:16,fontWeight:700,letterSpacing:'0.08em',cursor:'pointer'}}>Add Player</button>
      </div>
      {error && <div style={{marginTop:8,fontFamily:'var(--mono)',fontSize:16,color:'var(--red)'}}>{error}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]               = useState('gm')
  const [showHidden, setShowHidden] = useState(false)
  const [topHeat, setTopHeat]       = useState(0)
  const [topSession, setTopSession] = useState(1)
  const [ready, setReady]           = useState(false)
  const [auth, setAuth]             = useState<{id:string,username:string,role:string,characterId:string}|null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const isMobile = useIsMobile()

  // On mount: init DB tables, then check if already logged in
  useEffect(() => {
    fetch('/api/init', {method:'POST'})
      .then(() => api('/api/auth/me'))
      .then(user => {
        setAuth(user)
        if (user.role === 'player') setTab('galaxy')
        setAuthChecked(true)
      })
      .catch(() => setAuthChecked(true))
  }, [])

  // Fetch campaign data once authenticated
  useEffect(() => {
    if (!auth) return
    api('/api/campaign')
      .then(d => { setTopHeat(d.heatLevel||0); setTopSession(d.session||1); setReady(true) })
      .catch(() => setReady(true))
  }, [auth])

  // Refresh topbar when switching tabs
  useEffect(() => {
    if (!ready) return
    api('/api/campaign').then(d=>{ setTopHeat(d.heatLevel||0); setTopSession(d.session||1) }).catch(()=>{})
  }, [tab, ready])

  async function logout() {
    await fetch('/api/auth/logout', {method:'POST'}).catch(()=>{})
    setAuth(null); setReady(false); setTab('gm')
  }

  const isGm = auth?.role === 'gm'

  const ALL_TABS = [
    {id:'gm',          label:'GM Dashboard', icon:'⚙',  gmOnly:true},
    {id:'galaxy',      label:'Galaxy Map',   icon:'✦',  gmOnly:false},
    {id:'chars',       label: isGm ? 'Characters' : 'My Character', icon:'◈', gmOnly:false},
    {id:'initiative',  label:'Initiative',   icon:'⚡', gmOnly:true},
    {id:'adversaries', label:'Adversaries',  icon:'⚔',  gmOnly:true},
    {id:'ships',       label:'Ships',        icon:'◉',  gmOnly:true},
  ]
  const TABS = ALL_TABS.filter(t => isGm || !t.gmOnly)

  // Loading spinner while checking session
  if (!authChecked) return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
                 background:'var(--bg)',color:'var(--text-dim)',fontFamily:'var(--mono)',gap:12}}>
      <span style={{animation:'pulse 1s ease-in-out infinite'}}>●</span> Initialising…
    </div>
  )

  if (!auth) return <LoginScreen onLogin={user => { setAuth(user); if (user.role==='player') setTab('galaxy') }}/>

  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column'}}>
      {/* ── Top Bar ── */}
      <div style={{height:52,flexShrink:0,display:'flex',alignItems:'center',padding:'0 16px',
                   background:'linear-gradient(90deg,#080E1C 0%,#0A1228 50%,#080E1C 100%)',
                   borderBottom:'1px solid rgba(255,255,255,0.14)',position:'relative',zIndex:100}}>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:1,
                     background:'linear-gradient(90deg,transparent,var(--red),var(--gold),var(--red),transparent)'}}/>

        {!isMobile && (
          <div style={{fontFamily:'var(--display)',fontSize:21,fontWeight:700,color:'var(--gold)',
                       letterSpacing:'0.12em',textTransform:'uppercase',marginRight:32,whiteSpace:'nowrap'}}>
            Operation: <span style={{color:'var(--red)'}}>Silent</span> Running
          </div>
        )}

        {!isMobile && (
          <nav style={{display:'flex',gap:2,flex:1}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                style={{padding:'0 16px',height:52,border:'none',background:'none',
                        fontFamily:'var(--display)',fontSize:16,fontWeight:600,
                        letterSpacing:'0.08em',textTransform:'uppercase',cursor:'pointer',
                        color:tab===t.id?'var(--gold)':'var(--text-dim)',transition:'all 0.2s',
                        display:'flex',alignItems:'center',gap:8,
                        borderBottom:tab===t.id?'2px solid var(--gold)':'2px solid transparent'}}>
                <span style={{fontSize:17}}>{t.icon}</span>{t.label}
              </button>
            ))}
          </nav>
        )}

        <div style={{display:'flex',alignItems:'center',gap:isMobile?10:14,marginLeft:'auto'}}>
          {!isMobile && isGm && tab==='galaxy' && (
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div onClick={()=>setShowHidden(h=>!h)}
                style={{width:36,height:20,borderRadius:10,cursor:'pointer',transition:'background 0.2s',
                        background:showHidden?'var(--purple)':'rgba(255,255,255,0.1)',
                        border:`1px solid ${showHidden?'var(--purple-bright)':'var(--border)'}`,
                        position:'relative'}}>
                <div style={{width:14,height:14,borderRadius:'50%',background:'white',position:'absolute',
                             top:2,transition:'left 0.2s',left:showHidden?18:2}}/>
              </div>
              <span style={{fontFamily:'var(--mono)',fontSize:16,color:'var(--text-dim)'}}>Show Hidden</span>
            </div>
          )}
          {!isMobile && (
            <div style={{display:'flex',alignItems:'center',gap:5,fontFamily:'var(--mono)',fontSize:16,color:'var(--text-dim)'}}>
              <span>HEAT</span>
              {Array.from({length:10}).map((_,i)=>(
                <div key={i} style={{width:8,height:8,borderRadius:1,
                                     background:i<topHeat?(i>=7?'var(--red)':'#E67E22'):'rgba(255,255,255,0.1)',
                                     animation:i<topHeat&&i>=7?'pulse 1s ease-in-out infinite':''}}/>
              ))}
              <span style={{color:topHeat>=7?'#ef5350':topHeat>=4?'#FF9800':'var(--text-dim)'}}>{topHeat}/10</span>
            </div>
          )}
          {!isMobile && (
            <div style={{fontFamily:'var(--mono)',fontSize:16,color:'var(--text-dim)',
                         background:'var(--panel)',border:'1px solid var(--border)',
                         borderRadius:4,padding:'3px 8px'}}>
              Session {topSession}
            </div>
          )}
          {/* User badge + logout */}
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontFamily:'var(--mono)',fontSize:16,color:'var(--text-dim)'}}>{auth.username}</span>
            <span style={{fontFamily:'var(--mono)',fontSize:15,borderRadius:3,padding:'2px 6px',
                          background:isGm?'rgba(212,172,13,0.1)':'rgba(74,144,226,0.1)',
                          border:`1px solid ${isGm?'rgba(212,172,13,0.3)':'rgba(74,144,226,0.3)'}`,
                          color:isGm?'var(--gold)':'#4a90e2'}}>{isGm?'GM':'PLAYER'}</span>
            <button onClick={logout}
              style={{padding:'3px 10px',borderRadius:4,border:'1px solid var(--border)',
                      background:'var(--panel)',color:'var(--text-dim)',fontFamily:'var(--display)',
                      fontSize:16,fontWeight:600,letterSpacing:'0.06em',cursor:'pointer'}}>Sign Out</button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{flex:1,overflow:'hidden',marginBottom:isMobile?52:0}}>
        {!ready && (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',
                       color:'var(--text-dim)',fontFamily:'var(--mono)',gap:12}}>
            <span style={{animation:'pulse 1s ease-in-out infinite'}}>●</span>
            Connecting to database…
          </div>
        )}
        {ready && tab==='gm'         && <div style={{height:'100%',overflowY:'auto'}}><GMDashboard/></div>}
        {ready && tab==='galaxy'     && <GalaxyMap showHidden={isGm && showHidden} isGm={!!isGm}/>}
        {ready && tab==='adversaries'&& <AdversariesView/>}
        {ready && tab==='ships'      && <ShipsView/>}
        {ready && tab==='chars'      && <CharactersView isGm={!!isGm} userId={auth.id||''}/>}
        {ready && tab==='initiative' && <InitiativeTracker/>}
      </div>

      {/* ── Mobile Bottom Nav ── */}
      {isMobile && (
        <nav style={{position:'fixed',bottom:0,left:0,right:0,height:52,
                     display:'flex',background:'linear-gradient(90deg,#080E1C 0%,#0A1228 50%,#080E1C 100%)',
                     borderTop:'1px solid rgba(255,255,255,0.14)',zIndex:200}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:1,border:'none',background:'none',cursor:'pointer',
                      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                      gap:3,padding:'4px 0',
                      borderTop:tab===t.id?'2px solid var(--gold)':'2px solid transparent',
                      color:tab===t.id?'var(--gold)':'var(--text-dim)'}}>
              <span style={{fontSize:21}}>{t.icon}</span>
              <span style={{fontFamily:'var(--display)',fontSize:14,fontWeight:600,
                            letterSpacing:'0.06em',textTransform:'uppercase'}}>{t.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
