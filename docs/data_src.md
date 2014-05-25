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

30 Birds from "output.xml"
```XQuery
for $y in doc('/Users/yena/git/zzZwitscherwecker/docs/birdlist.xml')/skip/abbr
for $x in doc('/Users/yena/git/zzZwitscherwecker/docs/output.xml')/files/file
where $x/ScientificNames=$y
return <birds><bird id="{data($x/PageId)}"><name>{data($x/CommonNames)}</name><sciname>{data($x/ScientificNames)}</sciname></bird></birds>
```

30 Birds from "dbpedia.xml"
```XQuery
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
        <img src="url"></img>
        <link>http://de.wikipedia.org/...</link>
        <mp3 src="path" length=""></mp3>
        <abs>short abstract ...</abs>
    </bird>
</birds>
```

The respective XSL file ("birddata.xsl") would be the following:
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
<?xml-stylesheet type="text/xsl" href="birddata.xsl"?>
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