import {defaultEventDetails,defaultSurveyFields} from './public-event';
import {defaultRegistrationFields} from './registration';
import type {CloudManagerEvent} from './cloud-manager';
export const demoStats={registered:5,checkedIn:3,remaining:2};
export const demoTeam=[{name:'ต้น ตัวอย่าง',email:'ton@example.test',access:['เช็กอิน']},{name:'ณิชา ตัวอย่าง',email:'nicha@example.test',access:['ค้นหาผู้ลงทะเบียน','เช็กอิน']},{name:'อร ตัวอย่าง',email:'orn@example.test',access:['ลงทะเบียน Walk-in']}];
export const demoEvent:CloudManagerEvent={id:'demo-event',name:'Creative Campus — ตัวอย่างอีเวนต์',status:'open',details:{...defaultEventDetails,name:'Creative Campus — ตัวอย่างอีเวนต์'},settings:{form:defaultRegistrationFields,survey:defaultSurveyFields}};
export const demoSummary={eventId:'demo-event',stats:demoStats,walkin:1,timeline:[{time:'09:00',count:1},{time:'10:00',count:2}]};
export const demoSurvey={eventName:demoEvent.name,registered:5,checkedIn:3,responses:3,questions:[{field:defaultSurveyFields[0],total:3,choices:{'ดีมาก':2,'ดี':1,'พอใช้':0,'ควรปรับปรุง':0},texts:[]},{field:defaultSurveyFields[2],total:3,choices:{},texts:['กิจกรรมน่าสนใจและทีมงานดูแลดี','อยากให้มีช่วงถามตอบเพิ่มขึ้น','สถานที่เดินทางสะดวก']} ]};
export const demoRegistrations=['ปภาวี ตัวอย่าง','ธนา ตัวอย่าง','ชลธิชา ตัวอย่าง','กิตติ ตัวอย่าง','อรทัย ตัวอย่าง'].map((name,i)=>({id:`demo-registration-${i}`,name,email:`guest${i+1}@example.test`,answers:{name,email:`guest${i+1}@example.test`},form_fields:defaultRegistrationFields,created_at:`2026-11-25T0${i+1}:00:00Z`,source:i===4?'walkin':'preregistered',checkins:i<3?{checked_at:`2026-11-25T0${i+2}:00:00Z`,via:'qr'}:null}));
