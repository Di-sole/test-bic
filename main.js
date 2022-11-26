import fetch from 'node-fetch';
import AdmZip from 'adm-zip';
import iconv from 'iconv-lite'
import convert from 'xml-js';
import fs from 'fs/promises';
import { Buffer } from 'node:buffer';

async function getData() {
	const zipName = 'data.zip';

	await fetch('http://www.cbr.ru/s/newbik')
		.then(res => res.arrayBuffer())
		.then(buf => fs.writeFile(zipName, Buffer.from(buf)))
		.catch(err => console.log(err))
		
	const zip = new AdmZip(zipName);
	const data = zip.getEntries()[0].getData();
	const dataConverted = convert.xml2json(iconv.decode(data, 'win1251'), { object: true });

	return JSON.parse(dataConverted);
}

async function getActualBic() {
	const data = await getData();

	const arrOfElements = data.elements[0].elements;
	const resultArr = [];

	arrOfElements.map(elem => {
		let name;
		const accounts = []
		const bic = elem.attributes.BIC;

		for (const obj of elem.elements) {
			if (obj.name == 'Accounts') {
				accounts.push(obj.attributes.Account)
			} else if (obj.name == 'ParticipantInfo') {
				name = obj.attributes.NameP;
			}
		}

		if (accounts.length > 0) {
			accounts.forEach(acc => resultArr.push({bic: bic, name: name, corrAccount: acc}))
		}
	});

	return resultArr;
}

const actualBic = await getActualBic();
console.log(actualBic)