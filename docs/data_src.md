The following section is for a course at Freie Universität Berlin.

# Data Extraction and Processing

## Data Sources

The sound files are from [species-id.net](http://species-id.net/openmedia/Category:Media_by_Tierstimmenarchiv_MfN).
We focus on the sound files of birds.

An additional source is dbpedia.org.


## Retrieving Data from ‘species-id.net’

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


## Getting Thumbnails and Abstracts from ‘DBpedia’

We, then, download thumbnails and abstracts of birds from DBpedia, using [SPARQL Editor](http://dbpedia.org/sparql), with the following script:

```sql
PREFIX d: <http://dbpedia.org/ontology/>
PREFIX ds: <http://dbpedia.org/resource/>
PREFIX prop: <http://dbpedia.org/property/>
PREFIX url: <http://www.w3.org/2002/07/owl>
select distinct 
?p, ?thumbnail, ?binomial, ?abstract
where {
?p d:class ds:Bird;
   d:thumbnail ?thumbnail;
   d:abstract ?abstract;
   dbpprop:binomial ?binomial.
    FILTER(regex(?binomial, "^anser anser$", "i")).
    filter(langMatches(lang(?abstract), "DE"))} LIMIT 1000
```

## Creating an XML Database 

For this project, we used an application called ‘BaseX’.

### Inserting Data

```XQuery
```

### Querying Data

```XQuery
```


## Creating an XML File for Our Application

### XML Schema

The first step is to look at what we need. Here is an example:
```XML
<?xml version='1.0' encoding='utf-8' ?>	
<voegel xmlns='./VogelQuiz.xsd'>
	<vogel>
		<name>Amsel</name>
		<bild src="url|embedded"></bild>
		<link>http://www.wikipedia.de/</link>
		<mp3  src="url|embedded" runtime=""></mp3>
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

### XSLT: Merging the Given Files into One


