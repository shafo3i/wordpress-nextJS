import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts/wordpress_migration"))
from readers import mysql_rows, php_value, dump_records
from uuid import uuid4

class ReaderTests(unittest.TestCase):
    def test_mysql_values(self):
        self.assertEqual(list(mysql_rows("(1,'a\\'b, c\\nline',NULL,'\\\\'),(2,'it''s','عربي','') ;")), [["1", "a'b, c\nline", None, "\\"], ["2", "it's", "عربي", ""]])
    def test_php_utf8_and_arrays(self):
        self.assertEqual(php_value('a:2:{s:4:"file";s:8:"صورة";s:5:"width";i:100;}'), {"file": "صورة", "width": 100})
    def test_reject_php_objects(self):
        with self.assertRaises(ValueError): php_value('O:8:"Exploit":0:{}')
    def test_php_null(self):
        self.assertIsNone(php_value('N;'))
    def test_multiline_dump(self):
        p=Path(__file__).resolve().parents[2]/'.local/wordpress-migration'/f'reader-test-{uuid4()}.sql'
        p.parent.mkdir(parents=True,exist_ok=True)
        try:
            p.write_text("CREATE TABLE `wp_posts` (\n `ID` bigint,\n `post_title` text\n);\nINSERT INTO `wp_posts` VALUES\n(1,'One'),\n(2,'Two');\n",encoding='utf-8')
            self.assertEqual([r[2]['post_title'] for r in dump_records(p)],['One','Two'])
        finally: p.unlink(missing_ok=True)

if __name__ == "__main__": unittest.main()
