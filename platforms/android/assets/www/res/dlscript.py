from bs4 import BeautifulSoup
import urllib

def encode(str):
	return urllib.quote(str.encode('utf8')).replace('http%3A//','http://')

with open ("birds.xml", "r") as myfile:
    data=myfile.read().replace('\n', '')

xml	= BeautifulSoup(data)
list = xml.find_all('bird')

for bird in list:
	print bird['id'],bird.img['src'], bird.mp3['src'],'\r\n\r\n'
	urllib.urlretrieve (encode(bird.img['src']), bird['id']+'.jpg')
	urllib.urlretrieve (encode(bird.mp3['src']), bird['id']+'.mp3')