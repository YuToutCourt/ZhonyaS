DROP TABLE IF EXISTS `Champion`;

CREATE TABLE `Champion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `url_image` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) 


INSERT INTO `Champion` VALUES (1,'Aatrox','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Aatrox.png'),(2,'Ahri','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Ahri.png'),(3,'Akali','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Akali.png'),(4,'Akshan','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Akshan.png'),(5,'Alistar','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Alistar.png'),(6,'Ambessa','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Ambessa.png'),(7,'Amumu','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Amumu.png'),(8,'Anivia','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Anivia.png'),(9,'Annie','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Annie.png'),(10,'Aphelios','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Aphelios.png'),(11,'Ashe','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Ashe.png'),(12,'AurelionSol','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/AurelionSol.png'),(13,'Aurora','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Aurora.png'),(14,'Azir','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Azir.png'),(15,'Bard','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Bard.png'),(16,'Belveth','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Belveth.png'),(17,'Blitzcrank','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Blitzcrank.png'),(18,'Brand','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Brand.png'),(19,'Braum','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Braum.png'),(20,'Briar','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Briar.png'),(21,'Caitlyn','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Caitlyn.png'),(22,'Camille','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Camille.png'),(23,'Cassiopeia','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Cassiopeia.png'),(24,'Chogath','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Chogath.png'),(25,'Corki','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Corki.png'),(26,'Darius','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Darius.png'),(27,'Diana','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Diana.png'),(28,'Draven','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Draven.png'),(29,'DrMundo','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/DrMundo.png'),(30,'Ekko','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Ekko.png'),(31,'Elise','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Elise.png'),(32,'Evelynn','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Evelynn.png'),(33,'Ezreal','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Ezreal.png'),(34,'Fiddlesticks','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Fiddlesticks.png'),(35,'Fiora','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Fiora.png'),(36,'Fizz','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Fizz.png'),(37,'Galio','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Galio.png'),(38,'Gangplank','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Gangplank.png'),(39,'Garen','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Garen.png'),(40,'Gnar','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Gnar.png'),(41,'Gragas','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Gragas.png'),(42,'Graves','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Graves.png'),(43,'Gwen','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Gwen.png'),(44,'Hecarim','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Hecarim.png'),(45,'Heimerdinger','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Heimerdinger.png'),(46,'Hwei','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Hwei.png'),(47,'Illaoi','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Illaoi.png'),(48,'Irelia','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Irelia.png'),(49,'Ivern','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Ivern.png'),(50,'Janna','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Janna.png'),(51,'JarvanIV','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/JarvanIV.png'),(52,'Jax','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Jax.png'),(53,'Jayce','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Jayce.png'),(54,'Jhin','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Jhin.png'),(55,'Jinx','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Jinx.png'),(56,'Kaisa','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Kaisa.png'),(57,'Kalista','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Kalista.png'),(58,'Karma','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Karma.png'),(59,'Karthus','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Karthus.png'),(60,'Kassadin','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Kassadin.png'),(61,'Katarina','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Katarina.png'),(62,'Kayle','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Kayle.png'),(63,'Kayn','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Kayn.png'),(64,'Kennen','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Kennen.png'),(65,'Khazix','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Khazix.png'),(66,'Kindred','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Kindred.png'),(67,'Kled','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Kled.png'),(68,'KogMaw','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/KogMaw.png'),(69,'KSante','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/KSante.png'),(70,'Leblanc','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Leblanc.png'),(71,'LeeSin','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/LeeSin.png'),(72,'Leona','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Leona.png'),(73,'Lillia','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Lillia.png'),(74,'Lissandra','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Lissandra.png'),(75,'Lucian','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Lucian.png'),(76,'Lulu','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Lulu.png'),(77,'Lux','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Lux.png'),(78,'Malphite','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Malphite.png'),(79,'Malzahar','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Malzahar.png'),(80,'Maokai','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Maokai.png'),(81,'MasterYi','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/MasterYi.png'),(82,'Mel','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Mel.png'),(83,'Milio','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Milio.png'),(84,'MissFortune','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/MissFortune.png'),(85,'MonkeyKing','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/MonkeyKing.png'),(86,'Mordekaiser','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Mordekaiser.png'),(87,'Morgana','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Morgana.png'),(88,'Naafiri','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Naafiri.png'),(89,'Nami','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Nami.png'),(90,'Nasus','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Nasus.png'),(91,'Nautilus','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Nautilus.png'),(92,'Neeko','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Neeko.png'),(93,'Nidalee','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Nidalee.png'),(94,'Nilah','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Nilah.png'),(95,'Nocturne','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Nocturne.png'),(96,'Nunu','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Nunu.png'),(97,'Olaf','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Olaf.png'),(98,'Orianna','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Orianna.png'),(99,'Ornn','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Ornn.png'),(100,'Pantheon','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Pantheon.png'),(101,'Poppy','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Poppy.png'),(102,'Pyke','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Pyke.png'),(103,'Qiyana','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Qiyana.png'),(104,'Quinn','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Quinn.png'),(105,'Rakan','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Rakan.png'),(106,'Rammus','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Rammus.png'),(107,'RekSai','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/RekSai.png'),(108,'Rell','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Rell.png'),(109,'Renata','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Renata.png'),(110,'Renekton','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Renekton.png'),(111,'Rengar','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Rengar.png'),(112,'Riven','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Riven.png'),(113,'Rumble','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Rumble.png'),(114,'Ryze','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Ryze.png'),(115,'Samira','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Samira.png'),(116,'Sejuani','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Sejuani.png'),(117,'Senna','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Senna.png'),(118,'Seraphine','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Seraphine.png'),(119,'Sett','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Sett.png'),(120,'Shaco','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Shaco.png'),(121,'Shen','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Shen.png'),(122,'Shyvana','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Shyvana.png'),(123,'Singed','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Singed.png'),(124,'Sion','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Sion.png'),(125,'Sivir','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Sivir.png'),(126,'Skarner','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Skarner.png'),(127,'Smolder','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Smolder.png'),(128,'Sona','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Sona.png'),(129,'Soraka','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Soraka.png'),(130,'Swain','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Swain.png'),(131,'Sylas','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Sylas.png'),(132,'Syndra','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Syndra.png'),(133,'TahmKench','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/TahmKench.png'),(134,'Taliyah','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Taliyah.png'),(135,'Talon','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Talon.png'),(136,'Taric','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Taric.png'),(137,'Teemo','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Teemo.png'),(138,'Thresh','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Thresh.png'),(139,'Tristana','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Tristana.png'),(140,'Trundle','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Trundle.png'),(141,'Tryndamere','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Tryndamere.png'),(142,'TwistedFate','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/TwistedFate.png'),(143,'Twitch','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Twitch.png'),(144,'Udyr','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Udyr.png'),(145,'Urgot','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Urgot.png'),(146,'Varus','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Varus.png'),(147,'Vayne','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Vayne.png'),(148,'Veigar','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Veigar.png'),(149,'Velkoz','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Velkoz.png'),(150,'Vex','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Vex.png'),(151,'Vi','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Vi.png'),(152,'Viego','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Viego.png'),(153,'Viktor','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Viktor.png'),(154,'Vladimir','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Vladimir.png'),(155,'Volibear','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Volibear.png'),(156,'Warwick','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Warwick.png'),(157,'Xayah','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Xayah.png'),(158,'Xerath','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Xerath.png'),(159,'XinZhao','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/XinZhao.png'),(160,'Yasuo','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Yasuo.png'),(161,'Yone','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Yone.png'),(162,'Yorick','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Yorick.png'),(163,'Yuumi','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Yuumi.png'),(164,'Zac','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Zac.png'),(165,'Zed','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Zed.png'),(166,'Zeri','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Zeri.png'),(167,'Ziggs','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Ziggs.png'),(168,'Zilean','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Zilean.png'),(169,'Zoe','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Zoe.png'),(170,'Zyra','https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/Zyra.png');

DROP TABLE IF EXISTS `Games`;
CREATE TABLE `Games` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date DEFAULT NULL,
  `type_game` varchar(100) DEFAULT NULL,
  `win` tinyint(1) DEFAULT NULL,
  `role_` varchar(100) DEFAULT NULL,
  `kills` int(11) DEFAULT NULL,
  `death` int(11) DEFAULT NULL,
  `assists` int(11) DEFAULT NULL,
  `total_team_kill` int(11) DEFAULT NULL,
  `player_id` int(11) DEFAULT NULL,
  `champion_id` int(11) DEFAULT NULL,
  `id_match` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `player_id` (`player_id`),
  KEY `champion_id` (`champion_id`),
  CONSTRAINT `Games_ibfk_1` FOREIGN KEY (`player_id`) REFERENCES `Player` (`id`),
  CONSTRAINT `Games_ibfk_2` FOREIGN KEY (`champion_id`) REFERENCES `Champion` (`id`)
) 


DROP TABLE IF EXISTS `Player`;
CREATE TABLE `Player` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `tag` varchar(100) DEFAULT NULL,
  `soloq` varchar(100) DEFAULT NULL,
  `flex` varchar(100) DEFAULT NULL,
  `puuid` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
)