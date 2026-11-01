import json
from pathlib import Path
import tempfile
import unittest
from PIL import Image

from quality import capture_check, appearance_check


class QualityGateTests(unittest.TestCase):
    def test_legacy_and_simulator_inputs_do_not_become_finished_models(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[2]/'.cache') as folder:
            path = Path(folder)/'session.json'
            for source, simulated in [('arkit', False), ('simulator-demo', True)]:
                path.write_text(json.dumps({'source':source,'simulated':simulated,'frames':[]}))
                self.assertFalse(capture_check(path)['passed'])

    def test_frame_count_and_client_pass_flag_are_not_enough(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[2]/'.cache') as folder:
            path = Path(folder)/'session.json'
            pose = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]
            frames = [{'segment':'room','camera_to_world':pose} for _ in range(200)]
            path.write_text(json.dumps({'source':'arkit','simulated':False,'quality_version':1,
                'status':'capture-checks-passed-not-reconstructed','camera_axes':'opengl',
                'quality':{'room':{'gate_passed':True}},'frames':frames}))
            result = capture_check(path)
            self.assertFalse(result['passed'])
            self.assertTrue(any('关键帧' in x for x in result['issues']))
            self.assertTrue(any('一圈' in x for x in result['issues']))

    def test_appearance_gate_requires_all_holdouts_and_rejects_bad_render(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[2]/'.cache') as folder:
            root = Path(folder); (root/'eval').mkdir()
            Image.new('RGB',(16,16),'white').save(root/'source.png')
            (root/'transforms.json').write_text(json.dumps({'frames':[{'file_path':'source.png'}]*20}))
            Image.new('RGB',(16,16),'white').save(root/'eval/000000.png')
            self.assertFalse(appearance_check(root,root/'eval')['passed'])
            Image.new('RGB',(16,16),'black').save(root/'eval/000010.png')
            self.assertFalse(appearance_check(root,root/'eval')['passed'])
            Image.new('RGB',(16,16),'white').save(root/'eval/000010.png')
            self.assertTrue(appearance_check(root,root/'eval')['passed'])
