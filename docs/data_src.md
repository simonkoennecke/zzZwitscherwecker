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
     FILTER(regex(?links, "^http://de", "i")).
     FILTER(langMatches(lang(?abstract), "DE"))
} 
LIMIT 3000
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
   <binding name="p"><uri>http://dbpedia.org/resource/American_Black_Duck</uri></binding>
   <binding name="thumbnail"><uri>http://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Blackduck.jpg/200px-Blackduck.jpg</uri></binding>
   <binding name="binomial"><literal xml:lang="en">Anas rubripes</literal></binding>
   <binding name="abstract"><literal xml:lang="de">Die Dunkelente (Anas rubripes) ist eine nordamerikanische Art aus der Familie der Entenvögel. Sie stellt eine Ausnahme innerhalb der Eigentlichen Enten dar, weil sie keinen Geschlechtsdimorphismus aufweist. Beide Geschlechter ähneln in ihrem Erscheinungsbild den Weibchen der Stockente. Sie sind allerdings insgesamt etwas dunkler gefärbt und haben auffallend helle Wangen und Halsseiten. Gelegentlich wird sie wegen ihrer vielen Gemeinsamkeiten mit der Stockente auch nur als Unterart dieser Art eingeordnet. Untersuchungen an 58.000 geschossenen Tieren beider Arten ergaben jedoch nur 318 intermediäre Bastarde. Heute dringt die Stockente jedoch zunehmend in die traditionellen Verbreitungsgebiete der Dunkelente ein, wodurch der Hybridanteil steigt.</literal></binding>
   <binding name="links"><uri>http://de.dbpedia.org/resource/Dunkelente</uri></binding>
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
        <mp3 src="path" length=""></mp3>
        <img src="url"/>
        <link>http://de.wikipedia.org/...</link>
        <abs>short abstract ...</abs>
    </bird>
	...
</birds>
```

The corresponding XSL file ("transform.xsl") would be the following:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<xsl:transform version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fn="http://www.functx.com" xmlns:xpath="http://www.w3.org/TR/xpath">
<xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>
	<!--documents:-->
	<xsl:variable name="birds" select="document('output.xml')/files" />
	<xsl:variable name="dbpedia" select="document('dbpedia.xml')/results" />

	<!--for filtering out selected birds-->
	<xsl:variable name="skip" select="document('birdlist.xml')/skip" />

	<!--main-->
	<xsl:template match="/">
		<birds>
			<xsl:for-each select="$skip/abbr">
				<bird>
					<xsl:call-template name="bird">
						<xsl:with-param name="skipname" select="."/>
					</xsl:call-template>
					<xsl:call-template name="db">
						<xsl:with-param name="skipname" select="."/>
					</xsl:call-template>
				</bird>
			</xsl:for-each>
		</birds>
	</xsl:template>
	
	<xsl:template name="bird" match="file">
		<xsl:param name="skipname"/>
		<xsl:for-each select="$birds/file">
        	<xsl:if test="ScientificNames = $skipname">
				<name><xsl:value-of select="CommonNames"/></name>
				<sciname><xsl:value-of select="ScientificNames"/></sciname>
				<mp3 src="{DownloadLink}" length="{substring-before(substring-after(Description, 'Length: '), ')')}"/>
			</xsl:if>
		</xsl:for-each>
	</xsl:template>

	<xsl:template name="db" match="result">
		<xsl:param name="skipname"/>
		<xsl:for-each select="$dbpedia/result">
        	<xsl:if test="binding[@name='binomial'] = $skipname">
				<img src="{binding[@name='thumbnail']}"/>
				<link>
				    <xsl:call-template name="string-replace-all">
				      <xsl:with-param name="text" select="binding[@name='links']/uri" />
				      <xsl:with-param name="replace" select="'dbpedia.org/resource'" />
				      <xsl:with-param name="by" select="'wikipedia.org/wiki'" />
				    </xsl:call-template>
				</link>
				<abs><xsl:value-of select="binding[@name='abstract']"/></abs>
			</xsl:if>
		</xsl:for-each>
	</xsl:template>
	
	<!--replace function-->
	<xsl:template name="string-replace-all">
	  <xsl:param name="text" />
	  <xsl:param name="replace" />
	  <xsl:param name="by" />
	  <xsl:choose>
	    <xsl:when test="contains($text, $replace)">
	      <xsl:value-of select="substring-before($text,$replace)" />
	      <xsl:value-of select="$by" />
	      <xsl:call-template name="string-replace-all">
	        <xsl:with-param name="text"
	        select="substring-after($text,$replace)" />
	        <xsl:with-param name="replace" select="$replace" />
	        <xsl:with-param name="by" select="$by" />
	      </xsl:call-template>
	    </xsl:when>
	    <xsl:otherwise>
	      <xsl:value-of select="$text" />
	    </xsl:otherwise>
	  </xsl:choose>
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
<?xml-stylesheet type="text/xsl" href="transform.xsl"?>
```

Then, we carry out the transformation using the following command (we are using Xalan-Java):
```
java org.apache.xalan.xslt.Process -IN output.xml -IN dbpedia.xml -XSL transform.xsl -OUT birddata.xml
```

### Validate with XML Schema

The first step is to look at what we need. Here is an example:
```XML
<?xml version='1.0' encoding='utf-8' ?> 
<birds xmlns='./VogelQuiz.xsd'>
    <bird id="1">
        <name>Amsel</name>
        <sciname>...</sciname>
		<mp3 src="path" length=""></mp3>
        <img src="url"/>
        <link>http://de.wikipedia.org/...</link>
        <abs>short abstract ...</abs>
    </bird>
</birds>
```

To validate it, we write an XML schema ("schema.xsd"):

```XML
<?xml version='1.0' encoding='utf-8' ?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
	<!-- STEP 1: define the simple-type elements -->
	<xs:element name="name" type="xs:string" />
	<xs:element name="sciname" type="xs:string"/>
	<xs:element name="img">
		<xs:complexType>
			<xs:simpleContent>
				<xs:extension base="xs:string">
					<xs:attribute name="src" type="xs:anyURI" use="required"/>
				</xs:extension>
			</xs:simpleContent>
		</xs:complexType>
	</xs:element>
	<xs:element name="link" type="xs:string"/>
	<xs:element name="mp3">
		<xs:complexType>
			<xs:simpleContent>
				<xs:extension base="xs:string">
					<xs:attribute name="src" type="xs:anyURI" use="required"/>
					<xs:attribute name="length" type="xs:string" use="required"/>
				</xs:extension>
			</xs:simpleContent>
		</xs:complexType>
	</xs:element>
	<xs:element name="abs" type="xs:string"/>
    <!-- STEP 2: define the attributes -->
    <xs:attribute name="id" type="xs:decimal"/>
    <!--
        STEP 3: define the complex-type elements referring to the
        already defined elements and attributes above
    -->
	<xs:element name="birds">
		<xs:complexType>
	    	<xs:sequence>
				<xs:element ref="bird" maxOccurs="unbounded"/>
			</xs:sequence>
		</xs:complexType>
	</xs:element>
	
	<xs:element name="bird" >
	  	<xs:complexType>
			<xs:sequence>
				<xs:element ref="name" minOccurs="1"/>
				<xs:element ref="sciname" minOccurs="1"/>
				<xs:element ref="mp3" minOccurs="1"/>
				<xs:element ref="img" minOccurs="1"/>
				<xs:element ref="link" minOccurs="1"/>
				<xs:element ref="abs" minOccurs="1"/>
			</xs:sequence>
			<xs:attribute ref="id" use="required" />
	    </xs:complexType>
	</xs:element>
</xs:schema>
```

We need to add the following lines to the root element in "birddata.xml"
```xml
<birds xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="schema.xsd">
```

The XML file can be validated against the above schema with the following command:
```
xmllint --noout --schema schema.xsd birddata.xml
```

### Create an XML Database 

For this project, we used an application called ‘BaseX’.

#### Query Data

Example 1) 
* List all the names of birds that are longer than 20 letters.

```XQuery
for $file in db:open('output')/files/file
count $c
where string-length($file/ScientificNames)>20 and $c[.mod 2=0]
return data($file/ScientificNames)
```

This query returns the following:
Acrocephalus arundinaceus Acrocephalus dumetorum Acrocephalus paludicola Acrocephalus palustris Acrocephalus schoenobaenus Acrocephalus scirpaceus Calandrella brachydactyla Caprimulgus europaeus Carduelis flammea cabaret Carduelis flavirostris Carpodacus erythrinus Certhia brachydactyla Charadrius morinellus Chlidonias leucopterus Chroicocephalus ridibundus Coccothraustes coccothraustes Emberiza spodocephala Fringilla montifringilla Glaucidium passerinum Haematopus ostralegus Himantopus himantopus Locustella fluviatilis Locustella luscinioides Lophophanes cristatus Luscinia megarhynchos Montifringilla nivalis Nucifraga caryocatactes Nycticorax nycticorax Pelecanus onocrotalus Pelophylax lessonae Pelophylax ridibundus Phalaropus fulicarius Phoenicurus phoenicurus Phylloscopus collybita Phylloscopus sibilatrix Phylloscopus trochilus Plectrophenax nivalis Pyrrhocorax pyrrhocorax Recurvirostra avosetta




