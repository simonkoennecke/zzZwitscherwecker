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
   dbpprop:binomial ?binomial.
     FILTER(regex(?links, "^http://de", "i"))
     FILTER(regex(?binomial, "^anser anser$", "i")).
     FILTER(langMatches(lang(?abstract), "DE"))
} 
LIMIT 1000
```

## Create an XML Database 

For this project, we used an application called ‘BaseX’.

### Insert Data

```XQuery
```

### Query Data

```XQuery
```


## Create an XML File for Our Application

### XSLT: Merge the Given Files into One

#### Pick 30 Birds
We have chosen 30 birds for our alarm sound, based on how commonly they are seen in the nature. They are given by their scientific names:

Bubo bubo
Luscinia svecica
Lullula arborea
Athene noctua
Oriolus oriolus
Cygnus cygnus
Phoenicurus phoenicurus
Luscinia megarhynchos
Larus argentatus
Phylloscopus trochilus
Carduelis carduelis
Passer montanus
Emberiza citrinella
Phylloscopus collybita
Anser anser
Garrulus glandarius
Dendrocopos major
Fulica atra
Erithacus rubecula
Ardea cinerea
Buteo buteo
Corvus corone
Anas platyrhynchos
Columba palumbus
Delichon urbicum
Fringilla coelebs
Grus grus
Parus major
Phalacrocorax carbo
Pica pica
Falco tinnunculus

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


```

#### Create XSL Style Sheet 

We create an XSL Style Sheet ("birddata.xsl").

Information to be included are:

* Bird ID
* Common name
* Scientific name
* Thumbnail url
* Link to Wikipedia page
* Relative path to mp3 file
* Length of mp3 file
* Abstract in German


```xml
<xsl:transform version="1.0"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
```

### Validate using XML Scheme

The first step is to look at what we need. Here is an example:
```XML
<?xml version='1.0' encoding='utf-8' ?>	
<voegel xmlns='./VogelQuiz.xsd'>
	<vogel id="1">
		<name>Amsel</name>
		<wsname>...</wsname>
		<bild src="url|embedded"></bild>
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