The following section is for a course at Freie Universität Berlin.

# Data Extraction and Processing

## Data Sources

The sound files are from [species-id.net](http://species-id.net/openmedia/Category:Media_by_Tierstimmenarchiv_MfN).
We focus on the sound files of birds.

An additional source is dbpedia.org.


## Retrieve Data from ‘species-id.net’

Firstly, we retrieve the sound files from the species-id.net, using the following URL:

http://species-id.net/o/api.php?action=query&export&format=xml&cmtitle=Category:Media_by_Tierstimmenarchiv_MfN&prop=revisions&rvprop=content&list=categorymembers&cmlimit=700

With a simple script, we download a detailed version of each file:

http://species-id.net/o/api.php?action=query&export&format=xml&exportnowrap&titles=%FILENAME%

Now, with all the information, we can generate a new XML file. The PHP script is as follows:

```php
<?php
#
# The Script loads all media files from species-id.net into a csv file
#
set_time_limit (3600*10);
#
# Crawl all media files from the category Media_by_Tierstimmenarchiv_MfN
#
$cat = "http://species-id.net/o/api.php?action=query&export&format=xml&cmtitle=Category:Media_by_Tierstimmenarchiv_MfN&prop=revisions&rvprop=content&list=categorymembers&cmlimit=700";
#
# Show detials of the file
#
$ApiFile = "http://species-id.net/o/api.php?action=query&export&format=xml&exportnowrap&titles=";
#
# Path to object source of a mediawiki upload item
#
$dllink = "http://species-id.net/o/media/";

if(is_file(getcwd()."\\cat.xml")){
	$c  = file_get_contents($cat);
	file_put_contents(getcwd()."\\cat.xml", $c);
}
else{
	$c  = file_get_contents("cat.xml");
}
#Loaded XML
$xml = new SimpleXMLElement($c);
#Output XML
$o = new SimpleXMLElement("<?xml version=\"1.0\" encoding=\"utf-8\" ?><files></files>");


#
# Output data frame
#
$cnt = count($xml->query->categorymembers[0]);
for($i=0; $i < $cnt; $i++){
	
	$filename = $xml->query->categorymembers[0]->cm[$i]["title"][0];
	$fileId = $xml->query->categorymembers[0]->cm[$i]["pageid"][0];
	
	#is already on disk?
	$tmpFilename = getcwd()."\\".$fileId.".xml";
	if(is_file($tmpFilename)){
		$f = file_get_contents($tmpFilename);
	}
	else{
		$f = file_get_contents($ApiFile.$filename);
		file_put_contents($tmpFilename, $f);
	}
	
	#Add file to output xml
	$xmlFile = $o->addChild('file');
	
	#Parse file information
	$x = new SimpleXMLElement($f);
	
	#prepare download path
	$dlurl = str_replace(" ","_",str_replace("File:","", $filename));
	$md = md5($dlurl);
	
	$xmlFile->PageId = $fileId;
	$xmlFile->DownloadLink = $dllink.$md[0]."/".$md[0].$md[1]."/".$dlurl;
	$xmlFile->PageLink = "http://species-id.net/openmedia/".urlencode($filename);
	$xmlFile->ApiLink =  $ApiFile.urlencode($filename);
	$xmlFile->Filename =  $filename;
	
	# Meta Tag isn't in a xml format parse with reg. expression the value
	$pattern = '/\|\s*(.*)\s*=\s*(.*)\s*/';
	$str = str_replace("Length = ","Length: ", $x->page->revision->text);
	preg_match_all($pattern, $str, $matches);
	for($j=0; $j < count($matches[1]);$j++){
		$xmlFile->addChild(str_replace(" ","",$matches[1][$j]),  $matches[2][$j]);
	}
}

file_put_contents(getcwd()."\\output.xml", $o->asXML());

echo $o->asXML();
?>
```


## Get Thumbnails and Abstracts from ‘DBpedia’

We, then, download thumbnails and abstracts of birds from DBpedia, using [SPARQL Editor](http://dbpedia.org/sparql), with the following script:

```sql
PREFIX d: <http://dbpedia.org/ontology/>
PREFIX ds: <http://dbpedia.org/resource/>
PREFIX prop: <http://dbpedia.org/property/>
PREFIX url: <http://www.w3.org/2002/07/owl>
SELECT DISTINCT 
?p, ?thumbnail, ?binomial, ?abstract, ?links
WHERE {
?p d:class ds:Bird;
   d:thumbnail ?thumbnail;
   d:abstract ?abstract;
   owl:sameAs ?links;
   d:wikiPageInLinkCount ?count;
   dbpprop:binomial ?binomial.
     FILTER(?count > 100).
     FILTER(regex(?links, "^http://de", "i")).
     FILTER(langMatches(lang(?abstract), "DE"))
} 
LIMIT 1000
```



## Create an XML File for Our Application

### Create an XML Database 

For this project, we used an application called ‘BaseX’.

### Query Data

30 birds with medium-length mp3s from "output.xml":
```XQuery
for $y in doc('/Users/yena/git/zzZwitscherwecker/docs/birdlist.xml')/skip/abbr
for $x in doc('/Users/yena/git/zzZwitscherwecker/docs/output.xml')/files/file
where $x/ScientificNames=$y and substring-after(data($x/Filename), '-')='medium.mp3'
return (<birds><bird id="{data($x/PageId)}">
<name>{data($x/CommonNames)}</name>
<sciname>{data($x/ScientificNames)}</sciname>
<mp3 src="mp3/{data($x/PageId)}" length="{substring-before(substring-after(data($x/Description), ': '), ')')}"></mp3></bird></birds>)
```

30 birds from "dbpedia.xml":
```XQuery
for $y in doc('/Users/yena/git/zzZwitscherwecker/docs/birdlist.xml')/skip/abbr
for $z in doc('/Users/yena/git/zzZwitscherwecker/docs/dbpedia.xml')/results/result
where data($z/binding[@name='binomial'])=$y
return (<birds><img src="{data($z/binding[@name='thumbnail']/uri)}" />
<link>{replace(data($z/binding[@name='links']/uri), 'dbpedia.org/resource', 'wikipedia.org/wiki')}</link><abs>{data($z/binding[@name='abstract'])}</abs></birds>)
```

Now, 30 birds from both "output.xml" and "dbpedia.xml":
```XQuery
for $y at $i in doc('/Users/yena/git/zzZwitscherwecker/docs/birdlist.xml')/skip/abbr
for $x in doc('/Users/yena/git/zzZwitscherwecker/docs/output.xml')/files/file
for $z in doc('/Users/yena/git/zzZwitscherwecker/docs/dbpedia.xml')/results/result
where $x/ScientificNames=$y and substring-after(data($x/Filename), '-')='medium.mp3' and data($z/binding[@name='binomial'])=$y
return (<birds><bird id="{$i}">
<name>{data($x/CommonNames)}</name>
<sciname>{data($x/ScientificNames)}</sciname>
<img src="{data($z/binding[@name='thumbnail']/uri)}" />
<link>{replace(data($z/binding[@name='links']/uri), 'dbpedia.org/resource', 'wikipedia.org/wiki')}</link>
<mp3 src="{data($x/DownloadLink)}" length="{substring-before(substring-after(data($x/Description), ': '), ')')}"></mp3>
<abs>{data($z/binding[@name='abstract'])}</abs></bird></birds>)
```

Then, we get the following data:
```xml
<bird id="1">
  <name>Uhu</name>
  <sciname>Bubo bubo</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Uhu-muc.jpg/200px-Uhu-muc.jpg"/>
  <link>http://de.wikipedia.org/wiki/Uhu</link>
  <mp3 src="http://species-id.net/o/media/6/61/Bubo_bubo_TSA-medium.mp3" length="0:27"/>
  <abs>Der Uhu (Bubo bubo) ist eine Vogelart aus der Gattung der Uhus (Bubo), die zur Ordnung der Eulen (Strigiformes) gehört. Der Uhu ist die größte Eulenart. Uhus haben einen massigen Körper und einen auffällig dicken Kopf mit Federohren. Die Augen sind orangegelb. Das Gefieder weist dunkle Längs- und Querzeichnungen auf. Brust und Bauch sind dabei heller als die Rückseite. Der Uhu ist ein Standvogel, der in reich strukturierten Landschaften jagt. In Mitteleuropa brütet die Art vor allem in den Alpen sowie den Mittelgebirgen, daneben haben Uhus hier in den letzten Jahrzehnten aber auch das Flachland wieder besiedelt. Die Brutplätze finden sich vor allem in Felswänden und Steilhängen und in alten Greifvogelhorsten, seltener an Gebäuden oder auf dem Boden.</abs>
</bird>
<bird id="2">
  <name>Blaukehlchen</name>
  <sciname>Luscinia svecica</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Luscinia_svecica_volgae.jpg/200px-Luscinia_svecica_volgae.jpg"/>
  <link>http://de.wikipedia.org/wiki/Blaukehlchen</link>
  <mp3 src="http://species-id.net/o/media/1/14/Luscinia_svecica_TSA-medium.mp3" length="Gesang, teilweise im Flug vorgetragen (HG: Teichralle, Rothalstaucher, Blessralle, Rohrschwirl, Rohrdommel, Erdkröte, Wasserralle"/>
  <abs>Das Blaukehlchen (Luscinia svecica) ist eine Singvogelart aus der Familie der Fliegenschnäpper (Muscicapidae). Namensgebend ist die auffallende Blaufärbung von Kehle und Vorderbrust, die das Männchen im Brutkleid zeigt. Je nach Unterart befindet sich auf diesem Grund ein zentraler weißer oder roter „Stern“. Die zehn Unterarten werden daher in zwei Gruppen geteilt, das Weißsternige und das Rotsternige Blaukehlchen (Tundrablaukehlchen). Bei manchen Unterarten fehlt der Stern jedoch. Das Blaukehlchen besiedelt busch- oder röhrichtbestandene Biotope meist an sehr feuchten Standorten und ernährt sich überwiegend von Insekten. Es kommt in weiten Teilen der Paläarktis vor und hat jenseits der Beringstraße auch einen Teil Nordalaskas besiedelt. In Europa ist das Verbreitungsgebiet stark zergliedert und die Art vielerorts durch Mangel an geeignetem Lebensraum bedroht. Das Blaukehlchen ist ein Zugvogel. Die europäischen Blaukehlchen überwintern in Südspanien, Nordafrika, südlich der Sahara und in Südasien, wobei das Weißsternige Blaukehlchen eher ein Kurz- oder Mittelstreckenzieher und das Rotsternige Blaukehlchen Langstreckenzieher ist.</abs>
</bird>
<bird id="3">
  <name>Heidelerche</name>
  <sciname>Lullula arborea</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Lullula_arborea_Rodrigo)de_Almeida.jpg/200px-Lullula_arborea_Rodrigo)de_Almeida.jpg"/>
  <link>http://de.wikipedia.org/wiki/Heidelerche</link>
  <mp3 src="http://species-id.net/o/media/3/3b/Lullula_arborea_TSA-medium.mp3" length="0:22"/>
  <abs>Die Heidelerche (Lullula arborea) ist eine Vogelart aus der Familie der Lerchen (Alaudidae). Diese kleine Lerchenart besiedelt die südwestliche Paläarktis von England und Portugal bis in den Nordwesten des Iran und Turkmenistan. Sie bewohnt vor allem sonnige Offenflächen in oder am Rande von Wäldern. Die Art ist in Mitteleuropa ein mäßig häufiger Brutvogel und verbringt den Winter in Südwesteuropa sowie im nördlichen Mittelmeerraum.</abs>
</bird>
<bird id="4">
  <name>Steinkauz</name>
  <sciname>Athene noctua</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Mochuelo_Común_(_Athene_noctua_)(1).jpg/200px-Mochuelo_Común_(_Athene_noctua_)(1).jpg"/>
  <link>http://de.wikipedia.org/wiki/Steinkauz</link>
  <mp3 src="http://species-id.net/o/media/3/36/Athene_noctua_TSA-medium.mp3" length="0:22"/>
  <abs>Der Steinkauz (Athene noctua) ist eine kleine, kurzschwänzige Eulenart aus der Familie der Eigentlichen Eulen (Strigidae). Das Verbreitungsgebiet des Steinkauzes erstreckt sich über Eurasien und Nordafrika. Er ist ein charakteristischer Bewohner der Baumsteppe mit spärlicher oder niedriger Vegetation und jagt bevorzugt auf dem Boden. Ein einmal gewähltes Revier besetzt er meist über mehrere Jahre und zum Teil sogar lebenslang. Der Steinkauz galt bereits im antiken Griechenland als Vogel der Weisheit und war Sinnbild der Göttin Athene. Darauf verweist auch der wissenschaftliche Name, der übersetzt „nächtliche Athene“ bedeutet. Deswegen bezieht sich die Redewendung Eulen nach Athen tragen auf den Steinkauz bzw. seine Abbildung auf antiken Drachme-Münzen. Im deutschen Sprachraum ist der Name „Steinkauz“ Hinweis darauf, dass diese Eulenart nicht nur in Baumhöhlen, sondern auch in Scheunen, Kapellen und Weinkellern aus Stein brütet. In Mitteleuropa gehen die Steinkauzbestände seit einigen Jahrzehnten stark zurück. Hauptursache dieses Rückgangs ist die Zerstörung von Lebensräumen, die dem Steinkauz geeignete Umweltbedingungen bieten. 1972 war der Steinkauz Vogel des Jahres in Deutschland.</abs>
</bird>
<bird id="5">
  <name>Pirol</name>
  <sciname>Oriolus oriolus</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Oriole_2.jpg/200px-Oriole_2.jpg"/>
  <link>http://de.wikipedia.org/wiki/Pirol_(Art)</link>
  <mp3 src="http://species-id.net/o/media/c/c0/Oriolus_oriolus_TSA-medium.mp3" length="0:22"/>
  <abs>Der Pirol (Oriolus oriolus) ist ein Singvogel aus der Familie der Pirole (Oriolidae). Es gibt zwei im Gefieder deutlich differenzierte Unterarten. Oriolus oriolus oriolus ist die in Norden und Westen Eurasiens verbreitete Nominatform. In Mitteleuropa ist diese Unterart ein nirgends sehr häufiger Brut- und Sommervogel. Die Unterart Oriolus oriolus kundoo ist im südlichen Zentralasien und im Norden von Indien beheimatet.</abs>
</bird>
<bird id="6">
  <name>Singschwan</name>
  <sciname>Cygnus cygnus</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Singschwan.jpg/200px-Singschwan.jpg"/>
  <link>http://de.wikipedia.org/wiki/Singschwan</link>
  <mp3 src="http://species-id.net/o/media/9/97/Cygnus_cygnus_TSA-medium.mp3" length="Rufe (Length: 0:24"/>
  <abs>Der Singschwan (Cygnus cygnus) zählt innerhalb der Familie der Entenvögel (Anatidae) zur Gattung der Schwäne (Cygnus). Er ist etwas kleiner als der Höckerschwan und hat einen graderen, weniger geschwungenen Hals. Singschwäne sind Brutvögel der osteuropäischen und sibirischen Taiga. Im Herbst und Winter sind diese Schwäne auch in Mitteleuropa zu beobachten. In Küstengebieten und im norddeutschen Tiefland sind sie regelmäßiger Wintergast. Zunehmend kommt es aber auch zu Übersommerungen und vereinzelten Bruten in Mitteleuropa. Der Zug aus den Wintergebieten setzt im Oktober ein. Sie kehren ab März in ihre Brutgebiete zurück.</abs>
</bird>
<bird id="7">
  <name>Gartenrotschwanz</name>
  <sciname>Phoenicurus phoenicurus</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Gekraagde_Roodstaart_20040627.JPG/200px-Gekraagde_Roodstaart_20040627.JPG"/>
  <link>http://de.wikipedia.org/wiki/Gartenrotschwanz</link>
  <mp3 src="http://species-id.net/o/media/9/91/Phoenicurus_phoenicurus_TSA-medium.mp3" length="0:23"/>
  <abs>Der Gartenrotschwanz (Phoenicurus phoenicurus) ist eine Vogelart aus der Familie der Fliegenschnäpper (Muscicapidae), früher wurde die Gattung mit anderen schmätzerähnlichen Arten zu den Drosseln (Turdidae) gezählt. Er besiedelt Eurasien ostwärts bis zum Baikalsee sowie Teile Nordafrikas und des Nahen Ostens. Als Höhlen- und Halbhöhlenbrüter bewohnt er vorwiegend lichte Laubwälder, Parkanlagen und Gärten mit altem Baumbestand. Er ist ein Transsaharazieher, der sich schon im Spätsommer auf den Weg in die Winterquartiere macht. Seit Beginn der 80er Jahre sind die Bestände der Art stark rückläufig, scheinen sich jedoch in den letzten Jahren auf niedrigem Niveau zu stabilisieren. Der Gesamtbestand des Gartenrotschwanzes gilt nicht als gefährdet. Für das Jahr 2011 wurde er zum Vogel des Jahres in Deutschland und Österreich gewählt. In der Schweiz war er 2009 Vogel des Jahres.</abs>
</bird>
<bird id="8">
  <name>Nachtigall</name>
  <sciname>Luscinia megarhynchos</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Nachtigall_(Luscinia_megarhynchos)-2.jpg/200px-Nachtigall_(Luscinia_megarhynchos)-2.jpg"/>
  <link>http://de.wikipedia.org/wiki/Nachtigall</link>
  <mp3 src="http://species-id.net/o/media/f/fa/Luscinia_megarhynchos_TSA-medium.mp3" length="0:32"/>
  <abs>Die Nachtigall (Luscinia megarhynchos) ist eine Vogelart aus der Ordnung der Sperlingsvögel (Passeriformes), Unterordnung Singvögel (Passeres). Nach neueren molekularbiologischen Erkenntnissen zur Phylogenese der Singvögel wird sie heute meist zur Familie der Fliegenschnäpper (Muscicapidae) gestellt. Manchmal findet man sie aber auch heute noch bei den Drosseln (Turdidae) eingeordnet. Die nordöstliche Schwesterart der Nachtigall ist der Sprosser. In Deutschland war die Nachtigall im Jahre 1995 Vogel des Jahres.</abs>
</bird>
<bird id="9">
  <name>Silbermöwe</name>
  <sciname>Larus argentatus</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Larus_argentatus01.jpg/200px-Larus_argentatus01.jpg"/>
  <link>http://de.wikipedia.org/wiki/Silbermöwe</link>
  <mp3 src="http://species-id.net/o/media/e/ec/Larus_argentatus_TSA-medium.mp3" length="0:19"/>
  <abs>Die Silbermöwe (Larus argentatus) ist eine Vogelart aus der Familie der Möwen (Laridae) und die häufigste Großmöwe in Nord- und Westeuropa. Ihr Verbreitungsgebiet erstreckt sich vom Weißen Meer über die Küsten Fennoskandiens, der Ostsee, der Nordsee und des Ärmelkanals sowie über große Teile der Atlantikküste Frankreichs und der Britischen Inseln. Außerdem kommt die Art auf Island vor. Silbermöwen sind Koloniebrüter, deren Brutplätze meist auf unzugänglichen Inseln oder an Steilküsten liegen. Vielerorts brütet die Art aber auch in Dünengebieten oder Salzwiesen. Sie ist wie die meisten Möwen ein Allesfresser, ernährt sich aber vor allem von Krusten– und Weichtieren, Fischen und menschlichen Abfällen. Während die nördlichen Populationen Zugvögel sind, verbleiben die meisten übrigen Silbermöwen in der Nähe ihrer Brutgebiete. Vor allem junge Silbermöwen wandern jedoch teils große Strecken und sind dann auch weit im Binnenland zu finden. Nachdem die Art im 19. Jahrhundert durch Absammeln der Eier und Bejagung stark dezimiert worden war, erholten sich die Bestände im Laufe des 20. Jahrhunderts. Die Silbermöwe ist häufig Gegenstand der Forschung gewesen und als Art sehr gut untersucht. Insbesondere der Verhaltensforscher Nikolaas Tinbergen hat sich ausführlich mit ihr auseinandergesetzt. Bis zum Ende des 20.  Jahrhunderts wurden viele, heute als eigene Arten anerkannte Möwentaxa als Unterarten der Silbermöwe angesehen. Der Evolutionsbiologe Ernst Mayr zog daher die Silbermöwe als Beispiel für die Theorie der Ringspezies heran. Nach einer gründlichen Revision der Systematik der Möwen zu Anfang des 21. Jahrhunderts stellen sich die Verhältnisse jedoch sehr viel differenzierter dar. In den 1990er Jahren wurden zunächst die Steppen-, die Mittelmeer- und die Armeniermöwe zeitweilig als „Weißkopfmöwe“ abgegliedert, später als eigene Arten aufgestellt. Etwa 2005 wurde auch der Unterart smithsonianus als Amerikanischer Silbermöwe (Larus smithsonianus) und der Unterart vegae als Ostsibirienmöwe (Larus vegae) Artstatus zugebilligt. Die Silbermöwe in ihrer heutigen Definition ist recht nahe mit der Mittelmeermöwe und der Mantelmöwe, nur entfernt jedoch mit Herings- und Steppenmöwe verwandt. Auch die Amerikanische Silbermöwe steht ihr nicht sehr nahe.</abs>
</bird>
<bird id="10">
  <name>Fitis</name>
  <sciname>Phylloscopus trochilus</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Willow_Warbler_Phylloscopus_trochilus.jpg/200px-Willow_Warbler_Phylloscopus_trochilus.jpg"/>
  <link>http://de.wikipedia.org/wiki/Fitis</link>
  <mp3 src="http://species-id.net/o/media/8/86/Phylloscopus_trochilus_TSA-medium.mp3" length="0:23"/>
  <abs>Der Fitis (Phylloscopus trochilus) ist ein Singvogel aus der Gattung der Laubsänger (Phylloscopus) und der Familie der Grasmückenartigen (Sylviidae). Es werden mehrere Unterarten unterschieden. Die Nominatform Phylloscopus trochilus trochilus ist in Mitteleuropa ein verbreiteter und sehr häufiger Brut- und Sommervogel.</abs>
</bird>
<bird id="11">
  <name>Stieglitz</name>
  <sciname>Carduelis carduelis</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Carcar.jpg/200px-Carcar.jpg"/>
  <link>http://de.wikipedia.org/wiki/Stieglitz</link>
  <mp3 src="http://species-id.net/o/media/8/86/Carduelis_carduelis_TSA-medium.mp3" length="0:23"/>
  <abs>Der Stieglitz (Carduelis carduelis), auch Distelfink genannt, ist eine Vogelart aus der Familie der Finken (Fringillidae). Er besiedelt Westeuropa bis Mittelsibirien, Nordafrika sowie West- und Zentralasien. In Südamerika und Australien sowie auf Neuseeland und einigen Inseln Ozeaniens wurde er eingeführt. Seine Nahrung setzt sich aus halbreifen und reifen Sämereien von Stauden, Wiesenpflanzen und Bäumen zusammen. Die Art gilt derzeit als nicht gefährdet. Früher stellte der Stieglitz ein Symbol für Ausdauer, Fruchtbarkeit und Beharrlichkeit dar. Wegen seiner Vorliebe für Disteln ist er noch heute ein christliches Symbol für die Passion und den Opfertod Jesu Christi.</abs>
</bird>
<bird id="12">
  <name>Feldsperling</name>
  <sciname>Passer montanus</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Tree_Sparrow_Japan_Flip.jpg/200px-Tree_Sparrow_Japan_Flip.jpg"/>
  <link>http://de.wikipedia.org/wiki/Feldsperling</link>
  <mp3 src="http://species-id.net/o/media/6/60/Passer_montanus_TSA-medium.mp3" length="0:23"/>
  <abs>Der Feldsperling (Passer montanus) ist eine in Eurasien weit verbreitete Vogelart in der Familie der Sperlinge (Passeridae). Er ist etwas kleiner als der Haussperling und im Westen der Paläarktis weniger an den Menschen angepasst und deutlich scheuer. In Mitteleuropa fehlt er in der Regel im Innenbereich von Dörfern und Städten als Brutvogel, dagegen ist er in einigen Regionen des Mittelmeerraums und Asiens ein ausgesprochener Stadtvogel und besetzt dort die ökologische Nische, die in anderen Regionen der Haussperling einnimmt. Der Feldsperling brütet in Gehölzen, Obstgärten, Alleen und Gärten in der Nähe von landwirtschaftlichen Nutzflächen oder Siedlungen. Das Nest befindet sich in Baumhöhlen, Mauernischen, Felsspalten oder zwischen Kletterpflanzen an Mauern. Die IUCN stuft den Feldsperling als nicht gefährdet (least concern) ein.</abs>
</bird>
<bird id="13">
  <name>Goldammer</name>
  <sciname>Emberiza citrinella</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Emberiza_citrinella_-New_Zealand_-North_Island-8.jpg/200px-Emberiza_citrinella_-New_Zealand_-North_Island-8.jpg"/>
  <link>http://de.wikipedia.org/wiki/Goldammer</link>
  <mp3 src="http://species-id.net/o/media/f/fc/Emberiza_citrinella_TSA-medium.mp3" length="0:23"/>
  <abs>Die Goldammer (Emberiza citrinella) ist eine Vogelart aus der Familie der Ammern (Emberizidae). Sie ist die häufigste Ammer in Europa und einer der charakteristischen Brutvögel der Feldmark. Außerhalb der Brutzeit bilden sich mitunter größere Trupps, die sich an günstigen Nahrungsplätzen am Rand von Dörfern oder an Fasanen- und Rebhuhnschütten einfinden. Während der Brutzeit dagegen ist die Goldammer streng territorial. Die IUCN stuft die Goldammer als nicht gefährdet (least concern) ein. Die Goldammer war Vogel des Jahres 1999 in Deutschland und 2002 in der Schweiz.</abs>
</bird>
<bird id="14">
  <name>Zilpzalp, Weidenlaubsänger</name>
  <sciname>Phylloscopus collybita</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Phylloscopus_collybita_(taxobox).jpg/200px-Phylloscopus_collybita_(taxobox).jpg"/>
  <link>http://de.wikipedia.org/wiki/Zilpzalp</link>
  <mp3 src="http://species-id.net/o/media/e/ef/Phylloscopus_collybita_TSA-medium.mp3" length="Gesang (Length: 0:28"/>
  <abs>Der Zilpzalp oder Weidenlaubsänger (Phylloscopus collybita) ist eine Vogelart aus der Familie der Grasmückenartigen (Sylviidae). Dieser Laubsänger besiedelt große Teile der Paläarktis vom Nordosten Spaniens und Irland nach Osten bis zur Kolyma in Sibirien. Zilpzalpe sind klein, ohne auffallende Zeichnungen und bewegen sich meist gedeckt in höherer Vegetation. Sie fallen daher am ehesten durch den markanten Gesang auf, dem die Art ihren lautmalenden deutschen Namen verdankt. Die Tiere bewohnen ein weites Spektrum bewaldeter Habitate und kommen auch häufig in Parks und den durchgrünten Randbereichen von Städten vor. Die Nahrung besteht vor allem aus kleinen und weichhäutigen Insekten. Der Zilpzalp ist je nach geografischer Verbreitung Kurz- bis Langstreckenzieher. Europäische Vögel überwintern im Bereich des Persischen Golfs, im Mittelmeerraum, in den Oasen der Sahara, in der Trockensavanne südlich der Sahara sowie im ostafrikanischen Hochland. Die Art ist in Europa ein sehr häufiger Brutvogel und nicht gefährdet.</abs>
</bird>
<bird id="15">
  <name>Graugans</name>
  <sciname>Anser anser</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Graugans_Anser_Anser.jpg/200px-Graugans_Anser_Anser.jpg"/>
  <link>http://de.wikipedia.org/wiki/Graugans</link>
  <mp3 src="http://species-id.net/o/media/9/95/Anser_anser_TSA-medium.mp3" length="0:24"/>
  <abs>Die Graugans (Anser anser) ist eine Art der Gattung Feldgänse (Anser) in der Familie der Entenvögel (Anatidae). Graugänse zählen zu den häufigsten Wasservögeln und sind die zweitgrößte Gänseart in Europa. Sie sind die wilden Vorfahren der domestizierten Hausgänse. Mitteleuropa gilt als die Region, in der diese Gans domestiziert wurde. Auf die verwandten Schwanengänse (Anser cygnoides) gehen die domestizierten asiatischen Höckergänse zurück. Die Graugans wurde von Carl von Linné 1758 in seinem Werk Systema naturae beschrieben.</abs>
</bird>
<bird id="16">
  <name>Eichelhäher</name>
  <sciname>Garrulus glandarius</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Garrulus_glandarius_1_Luc_Viatour.jpg/200px-Garrulus_glandarius_1_Luc_Viatour.jpg"/>
  <link>http://de.wikipedia.org/wiki/Eichelhäher</link>
  <mp3 src="http://species-id.net/o/media/e/e2/Garrulus_glandarius_TSA-medium.mp3" length="0:23"/>
  <abs>Der Eichelhäher (Garrulus glandarius) ist ein Singvogel aus der Familie der Rabenvögel (Corvidae). Er ist über Europa, Teile Nordafrikas und des Nahen Ostens sowie in einem breiten Gürtel durch Asien und dort südwärts bis nach Indochina verbreitet. Er brütet in lichten, strukturreichen Wäldern aller Art, in Mitteleuropa aber bevorzugt in Misch- und Laubwäldern. Sein Nahrungsspektrum ist sehr vielfältig, wobei im Sommerhalbjahr tierische, im Winterhalbjahr pflanzliche Nahrung überwiegt. Vor dem Winter werden umfangreiche Vorräte aus Eicheln und anderen Nussfrüchten angelegt. Süd- und westeuropäische Eichelhäher sind meist Standvögel, mittel-, ost- und nordeuropäische Teilzieher, wobei nur einige nördliche Populationen ihre Brutgebiete im Winter komplett räumen. In manchen Jahren kommt es zu umfangreichen Evasionen nord- und osteuropäischer Populationen.</abs>
</bird>
<bird id="17">
  <name>Buntspecht</name>
  <sciname>Dendrocopos major</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Buntspecht_Dendrocopos_major-2.jpg/200px-Buntspecht_Dendrocopos_major-2.jpg"/>
  <link>http://de.wikipedia.org/wiki/Buntspecht</link>
  <mp3 src="http://species-id.net/o/media/0/03/Dendrocopos_major_TSA-medium.mp3" length="0:28"/>
  <abs>Der Buntspecht (Dendrocopos major) ist eine Vogelart aus der Familie der Spechte (Picidae). Der kleine Specht besiedelt große Teile des nördlichen Eurasiens sowie Nordafrika und bewohnt Wälder fast jeder Art sowie Parks und baumreiche Gärten. Die Nahrung wird in allen (außer im Boden des Waldes) Strata des Waldes gesucht, jedoch vor allem in den Baumkronen. Sie besteht sowohl aus tierischen Anteilen, als auch, vor allem im Winter, aus pflanzlichem Material. Das Nahrungsspektrum ist sehr breit und umfasst verschiedenste Insekten und andere Wirbellose ebenso wie kleine Wirbeltiere und Vogeleier, Samen, Beeren und andere Früchte sowie Baumsäfte. Die Art ist häufig und der Bestand nimmt zumindest in Europa zu. Der Buntspecht wird von der IUCN daher als ungefährdet („least concern“) eingestuft.</abs>
</bird>
<bird id="18">
  <name>Blässhuhn</name>
  <sciname>Fulica atra</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Eurasian_Coot.jpg/200px-Eurasian_Coot.jpg"/>
  <link>http://de.wikipedia.org/wiki/Blässhuhn</link>
  <mp3 src="http://species-id.net/o/media/9/9b/Fulica_atra_TSA-medium.mp3" length="0:15"/>
  <abs>Das Blässhuhn (Fulica atra) ist eine mittelgroße Art aus der Familie der Rallen, die als einer der häufigsten Wasservögel bevorzugt auf nährstoffreichen Gewässern anzutreffen ist. Die Art ist über große Teile Eurasiens verbreitet und kommt darüber hinaus in Australasien vor. Die Art wird bisweilen auch „Blässralle“ genannt, um auf die korrekte taxonomische Einordnung hinzuweisen. Die alternative Schreibweise mit e (Blesshuhn, Blessralle), die auf die namengebende Blesse hinweist, wird ebenfalls oft verwendet.</abs>
</bird>
<bird id="19">
  <name>Rotkehlchen</name>
  <sciname>Erithacus rubecula</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Rouge_gorge_familier_-_crop_(WB_correction).jpg/200px-Rouge_gorge_familier_-_crop_(WB_correction).jpg"/>
  <link>http://de.wikipedia.org/wiki/Rotkehlchen</link>
  <mp3 src="http://species-id.net/o/media/f/f8/Erithacus_rubecula_TSA-medium.mp3" length="0:25"/>
  <abs>Das Rotkehlchen (Erithacus rubecula) ist eine Vogelart aus der Familie der Fliegenschnäpper (Muscicapidae). Es besiedelt Nordafrika, Europa und Kleinasien sowie die Mittelmeerinseln. Seine Nahrung besteht vor allem aus Insekten, kleinen Spinnen, Würmern und Schnecken. Sein Gesang beginnt etwa eine Stunde vor Sonnenaufgang und ist bis in die Dämmerung fast das ganze Jahr über zu hören. Die Art gilt derzeit als ungefährdet. Wegen seiner Häufigkeit und oft geringen Fluchtdistanz ist das Rotkehlchen ein besonderer Sympathieträger. In Christuslegenden steht es Jesus im Sterben tröstend bei. Zudem wird es als inoffizieller Nationalvogel Großbritanniens mit Weihnachten in Verbindung gebracht. Es hat bei der Entdeckung und wissenschaftlichen Anerkennung des Magnetsinns eine wichtige Rolle gespielt.</abs>
</bird>
<bird id="20">
  <name>Graureiher</name>
  <sciname>Ardea cinerea</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Ardea_cinerea_-_Pak_Thale.jpg/200px-Ardea_cinerea_-_Pak_Thale.jpg"/>
  <link>http://de.wikipedia.org/wiki/Graureiher</link>
  <mp3 src="http://species-id.net/o/media/e/ee/Ardea_cinerea_TSA-medium.mp3" length="0:21"/>
  <abs>Der Graureiher (Ardea cinerea), umgangssprachlich auch Fischreiher, ist eine Vogelart aus der Ordnung der Schreitvögel (Ciconiiformes). Er ist in Eurasien und Afrika weit verbreitet und häufig. Weltweit werden vier Unterarten unterschieden. In Mitteleuropa ist er mit der Nominatform Ardea cinerea cinerea vertreten.</abs>
</bird>
<bird id="21">
  <name>Mäusebussard</name>
  <sciname>Buteo buteo</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Buteo_buteo_-Netherlands-8.jpg/200px-Buteo_buteo_-Netherlands-8.jpg"/>
  <link>http://de.wikipedia.org/wiki/Mäusebussard</link>
  <mp3 src="http://species-id.net/o/media/d/d1/Buteo_buteo_TSA-medium.mp3" length="0:21"/>
  <abs>Der Mäusebussard (Buteo buteo) ist ein Greifvogel aus der Familie der Habichtartigen und der häufigste Vertreter dieser Familie in Mitteleuropa. Er ist mittelgroß und kompakt, das Gefieder variiert von Dunkelbraun bis fast Weiß. Er kann oft bei seinen kreisenden Segelflügen oder bei der Ansitzjagd beobachtet werden. Sein Lebensraum sind offene Landschaften wie Wiesen, Äcker und Heide mit angrenzenden Waldgebieten, in denen er sein Nest baut. Sein Verbreitungsgebiet umfasst ganz Europa mit Ausnahme Islands und dem Norden Skandinaviens. Nach Osten reicht das Areal über Zentralasien bis Japan. Kleinsäuger machen den Hauptteil seiner Nahrung aus, weiterhin gehören andere kleine Wirbeltiere, Insekten und Regenwürmer zum Nahrungsspektrum. Mäusebussarde sind überwiegend Teilzieher. Die Überwinterungsgebiete liegen in Mitteleuropa, Nordafrika, dem Nahen Osten und Indien. Der Mäusebussard ist nicht gefährdet, und seine Bestände sind, nach starker Verfolgung bis ins 20. Jahrhundert hinein, wieder zunehmend.</abs>
</bird>
<bird id="22">
  <name>Rabenkrähe</name>
  <sciname>Corvus corone</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Corvus_corone_Rabenkrähe_1.jpg/200px-Corvus_corone_Rabenkrähe_1.jpg"/>
  <link>http://de.wikipedia.org/wiki/Aaskrähe</link>
  <mp3 src="http://species-id.net/o/media/2/2f/Corvus_corone_TSA-medium.mp3" length="Flugrufe (Length: 0:23"/>
  <abs>Die Aaskrähe (Corvus corone) gehört zur Familie der Rabenvögel. Sie ist in Eurasien mit sechs Unterarten verbreitet, davon in Europa die Rabenkrähe und die Nebelkrähe (nordöstlich der Elbe). In Mitteleuropa ist die Aaskrähe ein sehr häufiger und verbreiteter Brut- und Jahresvogel.</abs>
</bird>
<bird id="23">
  <name>Ringeltaube</name>
  <sciname>Columba palumbus</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Columba_palumbus_-garden_post-8.jpg/200px-Columba_palumbus_-garden_post-8.jpg"/>
  <link>http://de.wikipedia.org/wiki/Ringeltaube</link>
  <mp3 src="http://species-id.net/o/media/4/46/Columba_palumbus_TSA-medium.mp3" length="0:23"/>
  <abs>Die Ringeltaube (Columba palumbus) ist eine Vogelart aus der Familie der Tauben (Columbidae). Sie ist die größte Taubenart Mitteleuropas und hier durch die weißen Flügelbänder und den weißen Halsstreifen kaum zu verwechseln. Sie besiedelt weite Teile der Paläarktis von Nordafrika, Portugal und Irland nach Osten bis Westsibirien und Kaschmir. Ringeltauben bewohnen bewaldete Landschaften aller Art, aber auch Alleen, Parks und Friedhöfe, heute auch bis in die Zentren der Städte. Die Ernährung erfolgt wie bei den meisten Arten der Familie fast ausschließlich pflanzlich. Die Ringeltaube ist je nach geografischer Verbreitung Standvogel, Teilzieher oder überwiegend Kurzstreckenzieher und verbringt den Winter vor allem in West- und Südwesteuropa. Die Art ist trotz der starken Bejagung in vielen Ländern ein häufiger Brutvogel und in Europa nicht gefährdet.</abs>
</bird>
<bird id="24">
  <name>Mehlschwalbe</name>
  <sciname>Delichon urbicum</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Delichon_urbicum_-Iceland_-flying-8.jpg/200px-Delichon_urbicum_-Iceland_-flying-8.jpg"/>
  <link>http://de.wikipedia.org/wiki/Mehlschwalbe</link>
  <mp3 src="http://species-id.net/o/media/f/f1/Delichon_urbicum_TSA-medium.mp3" length="0:24"/>
  <abs>Die Mehlschwalbe (Delichon urbicum) ist eine Vogelart aus der Familie der Schwalben (Hirundinidae). Sie ist neben Ufer-, Rauch- und Felsenschwalbe die vierte Art dieser Familie, die in Mitteleuropa als Brutvogel vorkommt. Sie ist besonders gut durch den weißen Bürzel zu identifizieren, den keine andere europäische Schwalbenart zeigt. Das Verbreitungsgebiet der Mehlschwalbe erstreckt sich über fast ganz Europa und das außertropische Asien. Trotz dieses großen Verbreitungsgebietes werden lediglich zwei Unterarten unterschieden. Mehlschwalben sind ausgeprägte Zugvögel. Die westeurasischen Brutvögel überwintern in der Regel in Afrika in einem Gebiet, das sich von der Südgrenze der Sahara bis zur Kapprovinz erstreckt. Die ostasiatischen Brutvögel halten sich während des Winterhalbjahres in einem Gebiet auf, das vom Süden Chinas über Indonesien bis nach Assam reicht.</abs>
</bird>
<bird id="25">
  <name>Buchfink</name>
  <sciname>Fringilla coelebs</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Chaffinch_(Fringilla_coelebs).jpg/200px-Chaffinch_(Fringilla_coelebs).jpg"/>
  <link>http://de.wikipedia.org/wiki/Buchfink</link>
  <mp3 src="http://species-id.net/o/media/d/d4/Fringilla_coelebs_TSA-medium.mp3" length="Gesang (Length: 0:24"/>
  <abs>Der Buchfink (Fringilla coelebs) ist ein zur Familie der Finken (Fringillidae) gehöriger Singvogel. Er kommt in ganz Europa mit Ausnahme Islands und des nördlichsten Skandinaviens vor, sein Verbreitungsgebiet erstreckt sich in östlicher Richtung bis nach Mittelsibirien. Er ist außerdem ein Brutvogel in Nordafrika und Vorderasien bis einschließlich des Irans. In Neuseeland und in der Südafrikanischen Republik ist der Buchfink vom Menschen eingeführt worden. In Mitteleuropa ist der Buchfink einer der am weitesten verbreiteten Brutvögel. Sein Verbreitungsgebiet reicht von der Küste bis zur Baumgrenze im Gebirge. Die Buchfinken Nord- und Osteuropas sind Zugvögel, dagegen ist er in Mitteleuropa ein Teilzieher. Es werden mehrere Unterarten unterschieden. Davon kommen drei auf den Kanarischen Inseln und je eine auf den Azoren, Madeira, Sardinien und Kreta vor.</abs>
</bird>
<bird id="26">
  <name>Kranich</name>
  <sciname>Grus grus</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Grus_grus_1_(Marek_Szczepanek).jpg/200px-Grus_grus_1_(Marek_Szczepanek).jpg"/>
  <link>http://de.wikipedia.org/wiki/Kranich</link>
  <mp3 src="http://species-id.net/o/media/5/5f/Grus_grus_TSA-medium.mp3" length="0:27"/>
  <abs>Der Kranich (Grus grus), auch Grauer Kranich oder Eurasischer Kranich genannt, ist der einzige Vertreter der Familie der Kraniche (Gruidae) in Nord- und Mitteleuropa. Kraniche bewohnen Sumpf- und Moorlandschaften in weiten Teilen des östlichen und nördlichen Europa, aber auch einige Gebiete im Norden Asiens. Sie nehmen das ganze Jahr über sowohl tierische als auch pflanzliche Nahrung auf. Der Bestand hat in den letzten Jahrzehnten stark zugenommen, so dass die Art zur Zeit nicht gefährdet ist. Die Schönheit der Kraniche und ihre spektakulären Balztänze haben schon in früher Zeit die Menschen fasziniert. In der griechischen Mythologie war der Kranich Apollon, Demeter und Hermes zugeordnet. Er war ein Symbol der Wachsamkeit und Klugheit und galt als „Vogel des Glücks“. In China stand er für ein langes Leben, Weisheit, das Alter sowie die Beziehung zwischen Vater und Sohn. Auch in Japan ist der Kranich ein Symbol des Glücks und der Langlebigkeit. In der Heraldik ist der Kranich das Symbol der Vorsicht und der schlaflosen Wachsamkeit. In der Dichtung wird der Kranich symbolisch für etwas „Erhabenes“ in der Natur verwendet.</abs>
</bird>
<bird id="27">
  <name>Kohlmeise</name>
  <sciname>Parus major</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Parus_major_2_Luc_Viatour.jpg/200px-Parus_major_2_Luc_Viatour.jpg"/>
  <link>http://de.wikipedia.org/wiki/Kohlmeise</link>
  <mp3 src="http://species-id.net/o/media/b/b0/Parus_major_TSA-medium.mp3" length="0:22"/>
  <abs>Die Kohlmeise (Parus major) ist eine Vogelart aus der Familie der Meisen (Paridae). Sie ist die größte und am weitesten verbreitete Meisenart in Europa.</abs>
</bird>
<bird id="28">
  <name>Kormoran</name>
  <sciname>Phalacrocorax carbo</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Phalacrocorax_carbo_ja01.jpg/200px-Phalacrocorax_carbo_ja01.jpg"/>
  <link>http://de.wikipedia.org/wiki/Kormoran_(Art)</link>
  <mp3 src="http://species-id.net/o/media/4/48/Phalacrocorax_carbo_TSA-medium.mp3" length="0:21"/>
  <abs>Der Kormoran (Phalacrocorax carbo) ist eine Vogelart aus der Familie der Kormorane (Phalacrocoracidae). Das Verbreitungsgebiet der Art umfasst große Teile Europas, Asiens und Afrikas, außerdem Australien und Neuseeland sowie Grönland und die Ostküste Nordamerikas. Die Nahrung besteht wie bei allen Vertretern der Gattung Phalacrocorax fast ausschließlich aus Fisch. Kormorane sind zu allen Jahreszeiten gesellig, die Brutkolonien liegen an Küsten oder größeren Gewässern. Bestand und Verbreitung der Art wurden in Europa durch massive menschliche Verfolgung stark beeinflusst, im mitteleuropäischen Binnenland war die Art zeitweise fast ausgerottet. In den letzten Jahrzehnten ist eine deutliche Bestandserholung zu verzeichnen. Der Kormoran war in Deutschland und Österreich Vogel des Jahres 2010.</abs>
</bird>
<bird id="29">
  <name>Elster</name>
  <sciname>Pica pica</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Pica_pica_-Helsinki,_Finland-8a.jpg/200px-Pica_pica_-Helsinki,_Finland-8a.jpg"/>
  <link>http://de.wikipedia.org/wiki/Elster</link>
  <mp3 src="http://species-id.net/o/media/2/25/Pica_pica_TSA-medium.mp3" length="0:23"/>
  <abs>Die Elster (Pica pica) ist eine Vogelart aus der Familie der Rabenvögel. Sie besiedelt weite Teile Europas und Asiens sowie das nördliche Nordafrika. In Europa ist sie vor allem im Siedlungsraum häufig. Aufgrund ihres charakteristischen schwarz-weißen Gefieders mit den auffallend langen Schwanzfedern ist sie auch für den vogelkundlichen Laien unverwechselbar. In der germanischen Mythologie war die Elster sowohl Götterbote als auch der Vogel der Todesgöttin Hel, so dass sie in Europa den Ruf des Unheilsboten bekam. Als „diebische“ Elster war sie auch im Mittelalter als Hexentier und Galgenvogel unbeliebt. Im Gegensatz dazu gilt sie in Asien traditionell als Glücksbringer und die lange Zeit als Unterart geführte nordamerikanische Hudsonelster (Pica hudsonia) ist bei den Indianern ein Geistwesen, das mit den Menschen befreundet ist.</abs>
</bird>
<bird id="30">
  <name>Turmfalke</name>
  <sciname>Falco tinnunculus</sciname>
  <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Common_kestrel_falco_tinnunculus.jpg/200px-Common_kestrel_falco_tinnunculus.jpg"/>
  <link>http://de.wikipedia.org/wiki/Turmfalke</link>
  <mp3 src="http://species-id.net/o/media/6/6a/Falco_tinnunculus_TSA-medium.mp3" length="0:26"/>
  <abs>Der Turmfalke (Falco tinnunculus) ist nach dem Mäusebussard der häufigste Greifvogel in Mitteleuropa. Vielen ist der Falke vertraut, da er sich auch Städte als Lebensraum erobert hat und oft beim Rüttelflug zu beobachten ist. Er war Vogel des Jahres 2007 in Deutschland und Vogel des Jahres 2008 in der Schweiz.</abs>
</bird>
```

### XSLT: Merge the Given Files into One

#### Pick 30 Birds
We have chosen 30 birds for our alarm sound, based on how commonly they are seen in the nature. They are given by their scientific names:

* Bubo bubo
* Luscinia svecica
* Lullula arborea
* Athene noctua
* Oriolus oriolus
* Cygnus cygnus
* Phoenicurus phoenicurus
* Luscinia megarhynchos
* Larus argentatus
* Phylloscopus trochilus
* Carduelis carduelis
* Passer montanus
* Emberiza citrinella
* Phylloscopus collybita
* Anser anser
* Garrulus glandarius
* Dendrocopos major
* Fulica atra
* Erithacus rubecula
* Ardea cinerea
* Buteo buteo
* Corvus corone
* Anas platyrhynchos
* Columba palumbus
* Delichon urbicum
* Fringilla coelebs
* Grus grus
* Parus major
* Phalacrocorax carbo
* Pica pica
* Falco tinnunculus

#### Look at the XML Documents

We want to merge the following XML Documents into one and restrict the data to the 30 birds listed above:

Bird sounds ("output.xml"):
```xml
<?xml version="1.0" encoding="utf-8"?>
<files>
  <file>
    <PageId>212623</PageId> <DownloadLink>http://species-id.net/o/media/b/b0/Accipiter_gentilis_TSA-medium.mp3</DownloadLink> <PageLink>http://species-id.net/openmedia/File%3AAccipiter+gentilis+TSA-medium.mp3</PageLink>    <ApiLink>http://species-id.net/o/api.php?action=query&amp;export&amp;format=xml&amp;exportnowrap&amp;titles=File%3AAccipiter+gentilis+TSA-medium.mp3</ApiLink>
    <Filename>File:Accipiter gentilis TSA-medium.mp3</Filename>
    <Title>Accipiter gentilis (Tierstimmenarchiv, medium length)</Title>
    <Type>Sound</Type>
    <Description>Rufreihen (Length: 0:22)</Description>
    <SubjectCategory>Aves</SubjectCategory>
    <ScientificNames>Accipiter gentilis</ScientificNames>
    <CommonNames>Habicht</CommonNames>
    <Creators>Tembrock</Creators>
    <CopyrightOwner>Museum für Naturkunde</CopyrightOwner>
    <WorldRegion>Europe</WorldRegion>
    <CountryCodes>de</CountryCodes>
    <Language>zxx</Language>
    <DerivedFrom>|Metadata Language=en;</DerivedFrom>
    <CopyrightStatement>Copyright [http://www.tierstimmenarchiv.de/ Tierstimmenarchiv] of the [http://www.naturkundemuseum-berlin.de/ Museum für Naturkunde] 2013</CopyrightStatement>
    <LicenseStatement>Creative Commons: Author Attribution Required, Share-Alike (CC BY-SA 3.0)</LicenseStatement>
  </file>
	<file>
		...
	</file>
	...
</files>
```

and data from DBpedia ("dbpedia.xml"):
```xml
<sparql xmlns="http://www.w3.org/2005/sparql-results#" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.w3.org/2001/sw/DataAccess/rf1/result2.xsd">
 <head>
  <variable name="p"/>
  <variable name="tn"/>
  <variable name="binomial"/>
  <variable name="abstract"/>
 </head>
 <results distinct="false" ordered="true">
  <result>
   <binding name="p"><uri>http://dbpedia.org/resource/Burrowing_Owl</uri></binding>
   <binding name="tn"><uri>http://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Burrowing_Owl_4354.jpg/200px-Burrowing_Owl_4354.jpg</uri></binding>
   <binding name="binomial"><literal xml:lang="en">Athene cunicularia</literal></binding>
   <binding name="abstract"><literal xml:lang="de">Der Kaninchenkauz oder auch Kaninchen-Eule, Präriekauz, Prärieeule oder Höhleneule (Athene cunicularia) ist eine Eule aus der Gattung der Steinkäuze (Athene), die sich durch sehr lange Beine auszeichnet. Er lebt als Bodenbewohner in den Grassteppen des westlichen Nord- und Südamerikas bis zum Kap Hoorn, außerdem kommt er in isolierten Populationen in Florida und auf einigen Karibischen Inseln vor.</literal></binding>
  </result>
	<result> ... </result>
	...
 </results>
</sparql>
```

#### Create XSL Style Sheet 

We create an XSL Style Sheet ("birddata.xsl").

Information to be included are:

* Bird ID
* Common name
* Scientific name
* Thumbnail URL
* Link to Wikipedia page
* Relative path to mp3 file
* Length of mp3 file
* Abstract in German

and our final xml data should look like this:

```xml
<?xml version='1.0' encoding='utf-8' ?> 
<birds xmlns='./VogelQuiz.xsd'>
    <bird id="1">
        <name>Amsel</name>
        <sciname>...</sciname>
        <img src="url"/>
        <link>http://de.wikipedia.org/...</link>
        <mp3 src="path" length=""></mp3>
        <abs>short abstract ...</abs>
    </bird>
</birds>
```

The respective XSL file ("birdschema.xsl") would be the following:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<xsl:transform version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">	
<xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>
	<!--documents:-->
	<xsl:variable name="birds" select="document('output.xml')/files" />
	<xsl:variable name="dbpedia" select="document('dbpedia.xml')/sparql/results" />
	<!--for filtering out 30 birds-->
	<xsl:variable name="skip" select="document('birdlist.xml')/skip/abbr" />
    <xsl:variable name="selectedbirds" select="parent::$birds/file/ScientificNames(@abbr = $skip/abbr)" />
		<xsl:template match="/">
        <birds>
        <xsl:for-each select="$selectedbirds">
			<!--find bird in dbpedia-->
			<xsl:for-each select="$dbpedia">
				<xsl:variable name="theSet" select="binding[@name='binomial' and string(.)='{ScientificNames}']"/>
		        <xsl:if test="$theSet">
		    		<name num="{$theSet/@num}">
		            	<xsl:variable name="dbbird" select="result" />
		        	</name>
		        </xsl:if>
		    </xsl:for-each>
            <bird id="{PageId}">
                <name><xsl:value-of select="CommonNames" /></name>
                <sciname><xsl:value-of select="ScientificNames" /></sciname>
                <img src="{$dbbird/binding[@tn]}"></img>
                <link><xsl:value-of select="{$dbbird/binding[@link]}" /></link>
                <mp3 src="vogel/mp3/{PageID}" length=""></mp3>
                <abs><xsl:value-of select="{$dbbird/binding[@abs]}" /></abs>
            </bird>
        </xsl:for-each>
        </birds>
    </xsl:template>
</xsl:transform>
```

with an external filter data ("birdlist.xml"):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<skip>
	<abbr>Bubo bubo</abbr>
	<abbr>Luscinia svecica</abbr>
	<abbr>Lullula arborea</abbr>
	<abbr>Athene noctua</abbr>
	<abbr>Oriolus oriolus</abbr>
	<abbr>Cygnus cygnus</abbr>
	<abbr>Phoenicurus phoenicurus</abbr>
	<abbr>Luscinia megarhynchos</abbr>
	<abbr>Larus argentatus</abbr>
	<abbr>Phylloscopus trochilus</abbr>
	<abbr>Carduelis carduelis</abbr>
	<abbr>Passer montanus</abbr>
	<abbr>Emberiza citrinella</abbr>
	<abbr>Phylloscopus collybita</abbr>
	<abbr>Anser anser</abbr>
	<abbr>Garrulus glandarius</abbr>
	<abbr>Dendrocopos major</abbr>
	<abbr>Fulica atra</abbr>
	<abbr>Erithacus rubecula</abbr>
	<abbr>Ardea cinerea</abbr>
	<abbr>Buteo buteo</abbr>
	<abbr>Corvus corone</abbr>
	<abbr>Anas platyrhynchos</abbr>
	<abbr>Columba palumbus</abbr>
	<abbr>Delichon urbicum</abbr>
	<abbr>Fringilla coelebs</abbr>
	<abbr>Grus grus</abbr>
	<abbr>Parus major</abbr>
	<abbr>Phalacrocorax carbo</abbr>
	<abbr>Pica pica</abbr>
	<abbr>Falco tinnunculus</abbr>
</skip>
```

Finally, we need to add the following XSL link to xml files, that we want to merge together.
```xml
<?xml-stylesheet type="text/xsl" href="birdschema.xsl"?>
```

### Validate with XML Schema

The first step is to look at what we need. Here is an example:
```XML
<?xml version='1.0' encoding='utf-8' ?> 
<birds xmlns='./VogelQuiz.xsd'>
    <bird id="1">
        <name>Amsel</name>
        <sciname>...</sciname>
        <img src="url"/>
        <link>http://de.wikipedia.org/...</link>
        <mp3 src="path" length=""></mp3>
        <abs>short abstract ...</abs>
    </bird>
</birds>
```

To validate it, we write an XML schema:

```XML
<?xml version='1.0' encoding='utf-8' ?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
	<!-- STEP 1: define the simple-type elements -->
	<xs:element name="name" type="xs:string"/>
	<xs:element name="sciname" type="xs:string"/>
	<xs:element name="img" type="xs:string">
		<xs:attribute name="src" type="xs:url"/>
	</xs:element>
	<xs:element name="link" type="xs:string"/>
	<xs:element name="mp3" type="xs:string">
		<xs:attribute name="src" type="xs:url"/>
		<xs:attribute name="length" type="xs:time"/>
	<xs:element>
	<xs:element name="abs" type="xs:string"/>
    <!-- STEP 2: define the attributes -->
    <xs:attribute name="id" type="xs:string"/>
    <!--
        STEP 3: define the complex-type elements referring to the
        already defined elements and attributes above
    -->
	<xs:element name="birds">
		<xs:complexType>
			<xs:attribute ref="id" />
	    	<xs:sequence>
				<xs:element ref="bird" />
			</xs:sequence>
		</xs:complexType>
	</xs:element>
	<xs:element name="bird">
	  	<xs:complexType>
			<xs:sequence>
				<xs:element ref="name" />
				<xs:element ref="sciname" />
				<xs:element ref="img" />
				<xs:element ref="link" />
				<xs:element ref="mp3" />
				<xs:element ref="abs" />
			</xs:sequence>
	    </xs:complexType>
	</xs:element>
</xs:schema>
```

We need to add the following lines to the root element in "birddata.xml"
```xml
<birds xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="Author.xsd">
```