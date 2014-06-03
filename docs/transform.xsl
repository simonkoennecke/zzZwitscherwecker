<?xml version="1.0" encoding="UTF-8"?>
<xsl:transform version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
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
				<bird id="{position()}">
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
	
	<!--data from output.xml-->
	<xsl:template name="bird" match="file">
		<xsl:param name="skipname"/>
		<xsl:for-each select="$birds/file">
        	<xsl:if test="ScientificNames = $skipname">
				<xsl:if test="substring-after(Filename, '-')='medium.mp3'">
					<name><xsl:value-of select="CommonNames"/></name>
					<sciname><xsl:value-of select="ScientificNames"/></sciname>
					<mp3 src="{DownloadLink}" length="{substring-before(substring-after(Description, ': '), ')')}"/>
				</xsl:if>
			</xsl:if>
		</xsl:for-each>
	</xsl:template>

	<!--data from dbpedia.xml-->
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