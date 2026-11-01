import json
from pathlib import Path
import tempfile
import unittest

from convert import convert, to_opengl

IDENTITY = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]


class CameraConversionTests(unittest.TestCase):
    def test_optical_conversion_preserves_translation_and_changes_forward(self):
        pose = [row[:] for row in IDENTITY]
        pose[0][3], pose[1][3], pose[2][3] = 1, 2, 3
        gl = to_opengl(pose, 'opencv')
        self.assertEqual([gl[i][3] for i in range(3)], [1, 2, 3])
        self.assertEqual([gl[i][i] for i in range(3)], [1, -1, -1])
        self.assertEqual(to_opengl(pose, 'opengl'), pose)

    def test_invalid_rotation_and_implicit_axes_are_rejected(self):
        bad = [row[:] for row in IDENTITY]; bad[0][0] = -1
        with self.assertRaises(ValueError): to_opengl(bad, 'opengl')
        with self.assertRaises(ValueError): to_opengl(IDENTITY, None)

    def make_session(self, root):
        from PIL import Image
        Image.new('RGB', (8, 6), 'red').save(root / 'frame.png')
        mask = Image.new('L', (8, 6), 0)
        for x in range(2, 6):
            for y in range(1, 5): mask.putpixel((x, y), 255)
        mask.save(root / 'mask.png')
        data = {'version': 1, 'units': 'meter', 'camera_axes': 'opengl', 'frames': [
            {'image': 'frame.png', 'mask': 'mask.png', 'segment': 'object-1', 'camera_to_world': IDENTITY,
             'intrinsics': {'w': 8, 'h': 6, 'fl_x': 6, 'fl_y': 6, 'cx': 4, 'cy': 3}}]}
        path = root / 'session.json'; path.write_text(json.dumps(data)); return path, data

    def test_object_alpha_and_room_mask_are_distinct_outputs(self):
        from PIL import Image
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[2] / '.cache') as temp:
            root = Path(temp); session, _ = self.make_session(root)
            result = convert(session, root / 'object', 'object', 'object-1')
            with Image.open(root / 'object' / result['frames'][0]['file_path']) as image:
                self.assertEqual(image.mode, 'RGBA')
                self.assertEqual(image.getpixel((0, 0))[3], 0)
                self.assertEqual(image.getpixel((3, 2))[3], 255)
            self.assertFalse((root / 'object/masks').exists())
            convert(session, root / 'room', 'room')
            self.assertTrue((root / 'room/masks/000000.png').exists())
            self.assertEqual(json.loads((root / 'object/job.json').read_text())['alpha_mode'], 'transparent')

    def test_path_escape_and_size_mismatch_fail_without_partial_output(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[2] / '.cache') as temp:
            root = Path(temp); session, data = self.make_session(root)
            data['frames'][0]['image'] = '../outside.png'; session.write_text(json.dumps(data))
            with self.assertRaises(ValueError): convert(session, root / 'out')
            self.assertFalse((root / 'out').exists())
            data['frames'][0]['image'] = 'frame.png'; data['frames'][0]['intrinsics']['w'] = 99
            session.write_text(json.dumps(data))
            with self.assertRaises(ValueError): convert(session, root / 'out')
            self.assertFalse((root / 'out').exists())

    def test_missing_foreground_mask_and_empty_selection_are_rejected(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[2] / '.cache') as temp:
            root = Path(temp); session, data = self.make_session(root)
            del data['frames'][0]['mask']; session.write_text(json.dumps(data))
            with self.assertRaises(ValueError): convert(session, root / 'out', 'object')
            with self.assertRaises(ValueError): convert(session, root / 'out', segment='missing')


if __name__ == '__main__':
    unittest.main()
