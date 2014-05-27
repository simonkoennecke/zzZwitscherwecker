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
			
            <bird id="{PageID}">
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