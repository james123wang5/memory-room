import json
from pathlib import Path
import tempfile
import unittest
import zipfile

from import_capture import import_capture

ROOT = Path(__file__).resolve().parents[2]
POSE = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]


class CaptureImportTests(unittest.TestCase):
    def test_preserves_simulated_origin_and_original_bytes(self):
        with tempfile.TemporaryDirectory(dir=ROOT/'.cache') as temp:
            root=Path(temp); archive=root/'test.capture.zip'
            session={'version':1,'units':'meter','camera_axes':'opengl','source':'simulator-demo','simulated':True,
                     'frames':[{'image':'images/000000.jpg','camera_to_world':POSE}]}
            with zipfile.ZipFile(archive,'w') as z:
                z.writestr('session.json',json.dumps(session)); z.writestr('images/000000.jpg',b'fixture-bytes')
            result=import_capture(archive,root/'raw')
            self.assertTrue(result['simulated'])
            self.assertEqual((root/'raw/images/000000.jpg').read_bytes(),b'fixture-bytes')
            with self.assertRaises(ValueError): import_capture(archive,root/'raw')

    def test_rejects_traversal_and_false_origin(self):
        with tempfile.TemporaryDirectory(dir=ROOT/'.cache') as temp:
            root=Path(temp)
            for i,path in enumerate(['../outside','/absolute','images/./x','images//x']):
                archive=root/f'bad-{i}.zip'
                with zipfile.ZipFile(archive,'w') as z: z.writestr(path,b'bad')
                with self.assertRaises(ValueError): import_capture(archive,root/f'out-{i}')
                self.assertFalse((root/f'out-{i}').exists())
            archive=root/'false-source.zip'
            session={'version':1,'units':'meter','camera_axes':'opengl','source':'simulator-demo','simulated':False,'frames':[]}
            with zipfile.ZipFile(archive,'w') as z: z.writestr('session.json',json.dumps(session))
            with self.assertRaises(ValueError): import_capture(archive,root/'false-out')


if __name__=='__main__': unittest.main()
