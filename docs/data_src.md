The following Section is for a course at Freie Universität.

# Data Sources

The sound files from [a species-id.net](http://species-id.net/openmedia/Category:Media_by_Tierstimmenarchiv_MfN) we focus on the sound files of birds.

The additional source is simple the dbpedia.org.


# Data Source Retrieval from species-id.net

In the first place we retrieved the sound files from the species-id.net, we used following url:

http://species-id.net/o/api.php?action=query&export&format=xml&cmtitle=Category:Media_by_Tierstimmenarchiv_MfN&prop=revisions&rvprop=content&list=categorymembers&cmlimit=700

With a simple script, we downloaded for each file a detailed version of the file:

http://species-id.net/o/api.php?action=query&export&format=xml&exportnowrap&titles=%FILENAME%

With all the information, we generate a new XML file. Therefore we used this little script:

```php

```


# Thumbnails and Abstracts from DBPedia

We downloaded thumbnails and abstracts of birds from DBPedia, using [a SPARQL Editor](http://dbpedia.org/sparql), with the following script:

```sql
PREFIX d: <http://dbpedia.org/ontology/>
PREFIX ds: <http://dbpedia.org/resource/>
PREFIX prop: <http://dbpedia.org/property/>
PREFIX url: <http://www.w3.org/2002/07/owl>
select distinct 
?p, ?tn, ?binomial, ?abstract
where {
?p d:class ds:Bird;
   d:thumbnail ?tn;
   d:abstract ?abstract;
   dbpprop:binomial ?binomial .
    FILTER(regex(?binomial, "^anser anser$", "i")).
    filter(langMatches(lang(?abstract), "DE"))} LIMIT 1000
```

# Creation of XML Database 

We used for our project an application called ‘BaseX’.

## Insert Data

```XQuery
```

## Query Data

```XQuery
```


# Create the XML File of Our Application

## XML Schema

The first step ist to look what we need. Here is an example:
```{XML}
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

To validate we wrote the XSD:

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

## XSLT merge the given files to one


