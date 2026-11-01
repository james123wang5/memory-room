import unittest
import numpy as np

from depth_seed import unproject


class DepthProjectionTests(unittest.TestCase):
    def test_image_down_is_negative_opengl_y_and_forward_is_negative_z(self):
        depth = np.full((2, 2), 2.0)
        intr = {'cx': 0, 'cy': 0, 'fl_x': 2, 'fl_y': 2}
        points, _, _ = unproject(depth, intr, np.eye(4), stride=1)
        np.testing.assert_allclose(points, [[0, 0, -2], [1, 0, -2], [0, -1, -2], [1, -1, -2]])

    def test_rigid_world_pose_preserves_metric_depth(self):
        pose = np.array([[0, 0, 1, 3], [0, 1, 0, 2], [-1, 0, 0, 1], [0, 0, 0, 1]])
        points, _, _ = unproject(np.array([[2.0]]), {'cx': 0, 'cy': 0, 'fl_x': 1, 'fl_y': 1}, pose, 1)
        np.testing.assert_allclose(points, [[1, 2, 1]])

    def test_invalid_and_out_of_range_depths_are_removed(self):
        depth = np.array([[np.nan, np.inf, 0, -1, 0.1, 6, 2]])
        points, x, y = unproject(depth, {'cx': 0, 'cy': 0, 'fl_x': 1, 'fl_y': 1}, np.eye(4), 1)
        self.assertEqual(len(points), 1)
        self.assertEqual((x.tolist(), y.tolist()), ([6], [0]))
