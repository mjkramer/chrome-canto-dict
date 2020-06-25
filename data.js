/*

	Rikaikun
	Copyright (C) 2010 Erek Speed
	http://code.google.com/p/rikaikun/
	
	---

	Originally based on Rikaichan 1.07
	by Jonathan Zarate
	http://www.polarcloud.com/

	---

	Originally based on RikaiXUL 0.4 by Todd Rudick
	http://www.rikai.com/
	http://rikaixul.mozdev.org/

	---

	This program is free software; you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation; either version 2 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program; if not, write to the Free Software
	Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

	---

	Please do not change or remove any of the copyrights or links to web pages
	when modifying any of the files. - Jon

*/
function ppcDict() {
	this.loadDictionary();
}
  
ppcDict.prototype = {
	config: {},

	setConfig: function(c) {
		this.config = c;
	},

	fileRead: function(url, charset) {
		var req = new XMLHttpRequest();
		req.open("GET", url, false);
		req.send(null);
		return req.responseText;
	},

	fileReadArray: function(name, charset) {
		var a = this.fileRead(name, charset).split('\n');
		// Is this just in case there is blank shit in the file.  It was writtin by Jon though.
		// I suppose this is more robust
		while ((a.length > 0) && (a[a.length - 1].length == 0)) a.pop();
		return a;
	},

	loadDictionary: function() {
		this.wordDict = this.fileRead(chrome.extension.getURL("data/dict-canto.dat"));
		this.wordIndex = this.fileRead(chrome.extension.getURL("data/dict-canto.idx"));
	},

	getUniqueArray: function(arr) {
		var a = [];
	    var l = arr.length;
	    for(var i=0; i<l; i++) {
	      for(var j=i+1; j<l; j++) {
	        // If this[i] is found later in the array
	        if (arr[i] === arr[j])
	          j = ++i;
	      }
	      a.push(arr[i]);
	    }
	    return a;
	},
	
	indexSearch: function (book, word) {
		var hit, k, start, end;
		var results = [];
		var indexString;
		var hanzisep = "\u00A7";
		var indexsep = "\uFF1A";
		
		//console.log('indexSearch: ' + word);	
		//find all hits for traditional characters
		hit = book.indexOf( "\n" + word + hanzisep);
		while (hit != -1) {			
			start = book.indexOf(indexsep, hit) + 1;
			end = book.indexOf("\n", start);
			indexString = book.substr(start, end - start); 
			results.push(parseInt(indexString));
			//console.log('trad hit: ' + indexString);			
			
			hit = book.indexOf( "\n" + word + hanzisep, hit+1);
		}
		
		//find all hits for simplified characters
		hit = book.indexOf(hanzisep + word + indexsep);
		while (hit != -1) {
			start = book.indexOf(indexsep, hit) + 1;
			end = book.indexOf("\n", start);
			indexString = book.substr(start, end - start); 
			results.push(parseInt(indexString));
			//console.log('simp hit: ' + indexString);			
			
			hit = book.indexOf(hanzisep + word + indexsep, hit+1);
		}
		
		return this.getUniqueArray(results).sort();
	},
	
	wordSearch: function (word) {
		var i;
		
		var entryobj = {};
		entryobj.data = [];
		
		var rawentries = [];
		while (word.length > 0) {
			//hits = start of the lines in the dict where the entries are
		    var hits = this.indexSearch(this.wordIndex, word);
		    
			for (i = 0; i < hits.length; i++) {
				var end = this.wordDict.indexOf("\n", hits[i]);
				var entryline = this.wordDict.substr(hits[i], end - hits[i]);
				rawentries.push(entryline);
				//console.log("hit " + word + " = " + entryline);
			}
			word = word.substr(0, word.length - 1);
		}

		entryobj.matchLen = 0;		
		for (i = 0; i < rawentries.length; i++) {
			//set highlight length to longest match
			var hanziLen = rawentries[i].indexOf(" ");
			if (hanziLen > entryobj.matchLen)
				entryobj.matchLen = hanziLen;
			
			entryobj.data.push([rawentries[i], null]);
		}
		return entryobj;
    },

	makeHtml: function(entry) {
		var e; 
		var k;
		
		var trad, simp, pinyin, def;
		var i, j, k;
		
		if (entry == null) return '';

		var b = [];
		
		if (entry.title)
			b.push('<div class="w-title">' + entry.title + '</div>');

		for (i = 0; i < entry.data.length; ++i) {
			e = entry.data[i][0].match(/^(.+?)\s+(?:\[(.*?)\])?\s+(?:\[(.*?)\])?\s*\/(.+)\//);
			if (!e) continue;

			trad = e[1].split(" ")[0];
			simp = e[1].split(" ")[1];
			//pinyin = e[2];
			pinyinSplit = e[2].split("|");
			pinyin = "";
			for(j = 0; j < pinyinSplit.length; j++)
			{
				if(j)
					pinyin += " | ";
				pinyin += pinyinSplit[j];
			}

			//HANZI
			k = "";
			{
				var hanzi = trad;
				k += '<span class="w-hanzi3">' + hanzi + '</span>';
			}
			
			//PINYIN
			k += '&#32;&#32; <span class="w-kana">';
			k += pinyin + '</span>';

			b.push(k);

			//DEFINITION
			def = e[4].replace(/\//g, '; ');
			b.push('<br/><span class="w-def">' + def + '</span>');
		}
		
		if (entry.more) b.push('...<br/>');

		return b.join('');
	},

};
