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

## Create an XML Database 

For this project, we used an application called ‘BaseX’.

### Query Data

30 Birds with medium-length mp3s from "output.xml"
```XQuery
for $y in doc('/Users/yena/git/zzZwitscherwecker/docs/birdlist.xml')/skip/abbr
for $x in doc('/Users/yena/git/zzZwitscherwecker/docs/output.xml')/files/file
where $x/ScientificNames=$y and substring-after(data($x/Filename), '-')='medium.mp3'
return (<birds><bird id="{data($x/PageId)}">
<name>{data($x/CommonNames)}</name>
<sciname>{data($x/ScientificNames)}</sciname>
<mp3 src="mp3/{data($x/PageId)}" length="{substring-before(substring-after(data($x/Description), ': '), ')')}"></mp3></bird></birds>)
```

30 Birds from "dbpedia.xml"
```XQuery
for $y in doc('/Users/yena/git/zzZwitscherwecker/docs/birdlist.xml')/skip/abbr
for $z in doc('/Users/yena/git/zzZwitscherwecker/docs/dbpedia.xml')/results/result
where data($z/binding[@name='binomial'])=$y
return (<birds><img src="{data($z/binding[@name='thumbnail']/uri)}" />
<link>{replace(data($z/binding[@name='links']/uri), 'dbpedia.org/resource', 'wikipedia.org/wiki')}</link></birds>)
```

Now, 30 Birds from both "output.xml" and "dbpedia.xml"
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
<mp3 src="{data($x/DownloadLink)}" length="{substring-before(substring-after(data($x/Description), ': '), ')')}"></mp3></bird></birds>)
```
Then, we get the following data:
```xml
<birds>
  <bird id="1">
    <name>Uhu</name>
    <sciname>Bubo bubo</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Uhu-muc.jpg/200px-Uhu-muc.jpg"/>
    <link>http://de.wikipedia.org/wiki/Uhu</link>
    <mp3 src="mp3/212696" length="0:27"/>
  </bird>
</birds>
<birds>
  <bird id="2">
    <name>Blaukehlchen</name>
    <sciname>Luscinia svecica</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Luscinia_svecica_volgae.jpg/200px-Luscinia_svecica_volgae.jpg"/>
    <link>http://de.wikipedia.org/wiki/Blaukehlchen</link>
    <mp3 src="mp3/212893" length="Gesang, teilweise im Flug vorgetragen (HG: Teichralle, Rothalstaucher, Blessralle, Rohrschwirl, Rohrdommel, Erdkröte, Wasserralle"/>
  </bird>
</birds>
<birds>
  <bird id="3">
    <name>Heidelerche</name>
    <sciname>Lullula arborea</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Lullula_arborea_Rodrigo)de_Almeida.jpg/200px-Lullula_arborea_Rodrigo)de_Almeida.jpg"/>
    <link>http://de.wikipedia.org/wiki/Heidelerche</link>
    <mp3 src="mp3/212933" length="0:22"/>
  </bird>
</birds>
<birds>
  <bird id="4">
    <name>Steinkauz</name>
    <sciname>Athene noctua</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Mochuelo_Común_(_Athene_noctua_)(1).jpg/200px-Mochuelo_Común_(_Athene_noctua_)(1).jpg"/>
    <link>http://de.wikipedia.org/wiki/Steinkauz</link>
    <mp3 src="mp3/212812" length="0:22"/>
  </bird>
</birds>
<birds>
  <bird id="5">
    <name>Pirol</name>
    <sciname>Oriolus oriolus</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Oriole_2.jpg/200px-Oriole_2.jpg"/>
    <link>http://de.wikipedia.org/wiki/Pirol_(Art)</link>
    <mp3 src="mp3/212513" length="0:22"/>
  </bird>
</birds>
<birds>
  <bird id="6">
    <name>Singschwan</name>
    <sciname>Cygnus cygnus</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Singschwan.jpg/200px-Singschwan.jpg"/>
    <link>http://de.wikipedia.org/wiki/Singschwan</link>
    <mp3 src="mp3/212989" length="Rufe (Length: 0:24"/>
  </bird>
</birds>
<birds>
  <bird id="7">
    <name>Gartenrotschwanz</name>
    <sciname>Phoenicurus phoenicurus</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Gekraagde_Roodstaart_20040627.JPG/200px-Gekraagde_Roodstaart_20040627.JPG"/>
    <link>http://de.wikipedia.org/wiki/Gartenrotschwanz</link>
    <mp3 src="mp3/212494" length="0:23"/>
  </bird>
</birds>
<birds>
  <bird id="8">
    <name>Nachtigall</name>
    <sciname>Luscinia megarhynchos</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Nachtigall_(Luscinia_megarhynchos)-2.jpg/200px-Nachtigall_(Luscinia_megarhynchos)-2.jpg"/>
    <link>http://de.wikipedia.org/wiki/Nachtigall</link>
    <mp3 src="mp3/212709" length="0:32"/>
  </bird>
</birds>
<birds>
  <bird id="9">
    <name>Silbermöwe</name>
    <sciname>Larus argentatus</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Larus_argentatus01.jpg/200px-Larus_argentatus01.jpg"/>
    <link>http://de.wikipedia.org/wiki/Silbermöwe</link>
    <mp3 src="mp3/212901" length="0:19"/>
  </bird>
</birds>
<birds>
  <bird id="10">
    <name>Fitis</name>
    <sciname>Phylloscopus trochilus</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Willow_Warbler_Phylloscopus_trochilus.jpg/200px-Willow_Warbler_Phylloscopus_trochilus.jpg"/>
    <link>http://de.wikipedia.org/wiki/Fitis</link>
    <mp3 src="mp3/212590" length="0:23"/>
  </bird>
</birds>
<birds>
  <bird id="11">
    <name>Stieglitz</name>
    <sciname>Carduelis carduelis</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Carcar.jpg/200px-Carcar.jpg"/>
    <link>http://de.wikipedia.org/wiki/Stieglitz</link>
    <mp3 src="mp3/212982" length="0:23"/>
  </bird>
</birds>
<birds>
  <bird id="12">
    <name>Feldsperling</name>
    <sciname>Passer montanus</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Tree_Sparrow_Japan_Flip.jpg/200px-Tree_Sparrow_Japan_Flip.jpg"/>
    <link>http://de.wikipedia.org/wiki/Feldsperling</link>
    <mp3 src="mp3/212589" length="0:23"/>
  </bird>
</birds>
<birds>
  <bird id="13">
    <name>Goldammer</name>
    <sciname>Emberiza citrinella</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Emberiza_citrinella_-New_Zealand_-North_Island-8.jpg/200px-Emberiza_citrinella_-New_Zealand_-North_Island-8.jpg"/>
    <link>http://de.wikipedia.org/wiki/Goldammer</link>
    <mp3 src="mp3/212878" length="0:23"/>
  </bird>
</birds>
<birds>
  <bird id="14">
    <name>Zilpzalp, Weidenlaubsänger</name>
    <sciname>Phylloscopus collybita</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Phylloscopus_collybita_(taxobox).jpg/200px-Phylloscopus_collybita_(taxobox).jpg"/>
    <link>http://de.wikipedia.org/wiki/Zilpzalp</link>
    <mp3 src="mp3/212687" length="Gesang (Length: 0:28"/>
  </bird>
</birds>
<birds>
  <bird id="15">
    <name>Graugans</name>
    <sciname>Anser anser</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Graugans_Anser_Anser.jpg/200px-Graugans_Anser_Anser.jpg"/>
    <link>http://de.wikipedia.org/wiki/Graugans</link>
    <mp3 src="mp3/212480" length="0:24"/>
  </bird>
</birds>
<birds>
  <bird id="16">
    <name>Eichelhäher</name>
    <sciname>Garrulus glandarius</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Garrulus_glandarius_1_Luc_Viatour.jpg/200px-Garrulus_glandarius_1_Luc_Viatour.jpg"/>
    <link>http://de.wikipedia.org/wiki/Eichelhäher</link>
    <mp3 src="mp3/212630" length="0:23"/>
  </bird>
</birds>
<birds>
  <bird id="17">
    <name>Buntspecht</name>
    <sciname>Dendrocopos major</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Buntspecht_Dendrocopos_major-2.jpg/200px-Buntspecht_Dendrocopos_major-2.jpg"/>
    <link>http://de.wikipedia.org/wiki/Buntspecht</link>
    <mp3 src="mp3/212896" length="0:28"/>
  </bird>
</birds>
<birds>
  <bird id="18">
    <name>Blässhuhn</name>
    <sciname>Fulica atra</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Eurasian_Coot.jpg/200px-Eurasian_Coot.jpg"/>
    <link>http://de.wikipedia.org/wiki/Blässhuhn</link>
    <mp3 src="mp3/212824" length="0:15"/>
  </bird>
</birds>
<birds>
  <bird id="19">
    <name>Rotkehlchen</name>
    <sciname>Erithacus rubecula</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Rouge_gorge_familier_-_crop_(WB_correction).jpg/200px-Rouge_gorge_familier_-_crop_(WB_correction).jpg"/>
    <link>http://de.wikipedia.org/wiki/Rotkehlchen</link>
    <mp3 src="mp3/212801" length="0:25"/>
  </bird>
</birds>
<birds>
  <bird id="20">
    <name>Graureiher</name>
    <sciname>Ardea cinerea</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Ardea_cinerea_-_Pak_Thale.jpg/200px-Ardea_cinerea_-_Pak_Thale.jpg"/>
    <link>http://de.wikipedia.org/wiki/Graureiher</link>
    <mp3 src="mp3/212772" length="0:21"/>
  </bird>
</birds>
<birds>
  <bird id="21">
    <name>Mäusebussard</name>
    <sciname>Buteo buteo</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Buteo_buteo_-Netherlands-8.jpg/200px-Buteo_buteo_-Netherlands-8.jpg"/>
    <link>http://de.wikipedia.org/wiki/Mäusebussard</link>
    <mp3 src="mp3/212716" length="0:21"/>
  </bird>
</birds>
<birds>
  <bird id="22">
    <name>Rabenkrähe</name>
    <sciname>Corvus corone</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Corvus_corone_Rabenkrähe_1.jpg/200px-Corvus_corone_Rabenkrähe_1.jpg"/>
    <link>http://de.wikipedia.org/wiki/Aaskrähe</link>
    <mp3 src="mp3/212992" length="Flugrufe (Length: 0:23"/>
  </bird>
</birds>
<birds>
  <bird id="23">
    <name>Ringeltaube</name>
    <sciname>Columba palumbus</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Columba_palumbus_-garden_post-8.jpg/200px-Columba_palumbus_-garden_post-8.jpg"/>
    <link>http://de.wikipedia.org/wiki/Ringeltaube</link>
    <mp3 src="mp3/212558" length="0:23"/>
  </bird>
</birds>
<birds>
  <bird id="24">
    <name>Mehlschwalbe</name>
    <sciname>Delichon urbicum</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Delichon_urbicum_-Iceland_-flying-8.jpg/200px-Delichon_urbicum_-Iceland_-flying-8.jpg"/>
    <link>http://de.wikipedia.org/wiki/Mehlschwalbe</link>
    <mp3 src="mp3/212689" length="0:24"/>
  </bird>
</birds>
<birds>
  <bird id="25">
    <name>Buchfink</name>
    <sciname>Fringilla coelebs</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Chaffinch_(Fringilla_coelebs).jpg/200px-Chaffinch_(Fringilla_coelebs).jpg"/>
    <link>http://de.wikipedia.org/wiki/Buchfink</link>
    <mp3 src="mp3/212449" length="Gesang (Length: 0:24"/>
  </bird>
</birds>
<birds>
  <bird id="26">
    <name>Kranich</name>
    <sciname>Grus grus</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Grus_grus_1_(Marek_Szczepanek).jpg/200px-Grus_grus_1_(Marek_Szczepanek).jpg"/>
    <link>http://de.wikipedia.org/wiki/Kranich</link>
    <mp3 src="mp3/212836" length="0:27"/>
  </bird>
</birds>
<birds>
  <bird id="27">
    <name>Kohlmeise</name>
    <sciname>Parus major</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Parus_major_2_Luc_Viatour.jpg/200px-Parus_major_2_Luc_Viatour.jpg"/>
    <link>http://de.wikipedia.org/wiki/Kohlmeise</link>
    <mp3 src="mp3/212564" length="0:22"/>
  </bird>
</birds>
<birds>
  <bird id="28">
    <name>Kormoran</name>
    <sciname>Phalacrocorax carbo</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Phalacrocorax_carbo_ja01.jpg/200px-Phalacrocorax_carbo_ja01.jpg"/>
    <link>http://de.wikipedia.org/wiki/Kormoran_(Art)</link>
    <mp3 src="mp3/212710" length="0:21"/>
  </bird>
</birds>
<birds>
  <bird id="29">
    <name>Elster</name>
    <sciname>Pica pica</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Pica_pica_-Helsinki,_Finland-8a.jpg/200px-Pica_pica_-Helsinki,_Finland-8a.jpg"/>
    <link>http://de.wikipedia.org/wiki/Elster</link>
    <mp3 src="mp3/212846" length="0:23"/>
  </bird>
</birds>
<birds>
  <bird id="30">
    <name>Turmfalke</name>
    <sciname>Falco tinnunculus</sciname>
    <img src="http://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Common_kestrel_falco_tinnunculus.jpg/200px-Common_kestrel_falco_tinnunculus.jpg"/>
    <link>http://de.wikipedia.org/wiki/Turmfalke</link>
    <mp3 src="mp3/212659" length="0:26"/>
  </bird>
</birds>
```


## Create an XML File for Our Application

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

### Validate using XML Scheme

The first step is to look at what we need. Here is an example:
```XML
<?xml version='1.0' encoding='utf-8' ?>	
<voegel xmlns='./VogelQuiz.xsd'>
	<vogel id="1">
		<name>Amsel</name>
		<sciname>...</sciname>
		<img src="url|embedded"></img>
		<link>http://de.wikipedia.org/...</link>
		<mp3 src="path" length=""></mp3>
		<abs>short abstract ...</abs>
	</vogel>
</voegel>
```

To validate it, we write an XML Scheme:

```XML
<?xml version='1.0' encoding='utf-8' ?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
<xs:element name='voegel'>
	<xs:complexType>
    <xs:sequence>
      <xs:element name="vogel" />
	</xs:sequence>
  </xs:complexType>
</xs:element>

<xs:element name='vogel'>
	<xs:complexType>
    <xs:sequence>
      <xs:element name="name" type="xs:string"/>
	  <xs:element name="bild" type="xs:string"/>
	  <xs:element name="link" type="xs:string"/>
	  <xs:element name="mp3" type="xs:string"/>
	</xs:sequence>
  </xs:complexType>
</xs:element>
```